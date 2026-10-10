# Phase 06 — Campus intelligence: companies, interview experiences, clubs, Path Twins and roadmaps

| | |
|---|---|
| **Time box** | 1:10 (cumulative 7:00) |
| **Goal** | Campus-specific knowledge: company pages (roles, rounds, skills tested, alumni who work there, prep roadmap, experiences), structured interview experiences contributed by alumni and seniors, an honest clubs directory, Path Twins journeys and career roadmaps from real students organised by goal |
| **Prerequisites** | Phase 05 complete; companies and clubs seeded (Phase 01); milestones seeded (Phase 03) |
| **PRD features** | F20 Company pages, F21 Interview experiences, F22 Clubs, F23 Path Twins, F24 Career roadmaps, F25 Roadmaps by goal (human part; AI in Phase 09) |
| **Requirements** | FR-CO-1…2, FR-EXP-1…3, FR-CLUB-1…2, FR-TWIN-1, FR-RM-1; your "Features" list (company pages, roadmaps by goal, clubs directory) and numbered features 4 and 7 |
| **Reference** | `TRD.md` §5.2 (Company, Experience, Club, Milestone, Roadmap models), §11.3 (Path Twins), §8.6 (endpoints) |


> **Implementation notes (verified build).** `seed:content` inserts through the service functions and is idempotent (it removes earlier demo content and takes back the points it earned). Company tabs and profile-edit tabs keep the active tab in the URL hash instead of syncing it into state. "Seniors who were members" excludes first years. Twins "Year 1" counts distinct twins, not milestones.

---

## 1. What you will have at the end of this phase

- `/companies` grid and `/companies/:slug` with tabs Overview · Experiences · Alumni · Prep roadmap, including "Skills tested — you have X of Y".
- A 4-step structured experience form; experiences earn points and the Experience Sharer badge.
- `/clubs` with usefulness and time-cost meters, `/clubs/:slug` with reviews and a review form (not for first years).
- `/path-twins` showing your starting point and 3 alumni/senior journeys year by year.
- `/roadmaps` by goal (Product, Service, Quant/finance, Research, Startup, MS, MBA), detail with save and tick, and a creation form with projects, resources and "mistakes I made".
- Seed content for experiences, club reviews and roadmaps.
- The onboarding and profile "Target companies" field now loads real companies.

---

## 2. Concepts in this phase

- **Structured beats unstructured.** An experience is a set of rounds with types, topics and difficulty — so it can be filtered, searched, summarised (Phase 09) and turned into simulator questions (Phase 09).
- **Self-reported by default.** Nothing shared by users is presented as verified unless an admin verified it.
- **Ratings with two axes** ("how useful" and "how much time") are more honest than a single star rating and directly answer a first year's real question.
- **Twins, not rankings.** Path Twins shows realistic paths of people who started where you are — inspiration without comparison.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/modules/companies/companies.service.ts`, `companies.routes.ts` | List, detail, experiences, alumni |
| `src/modules/experiences/experiences.service.ts`, `experiences.routes.ts` | Create, detail |
| `src/modules/clubs/clubs.service.ts`, `clubs.routes.ts` | List with averages, detail, review upsert |
| `src/services/twins.ts`, `src/modules/twins/twins.routes.ts` | Path Twins |
| `src/modules/roadmaps/roadmaps.service.ts`, `roadmaps.routes.ts` | List, detail, create, save toggle, step toggle |
| `scripts/seed-content.ts` | Start it: experiences, club reviews, roadmaps (more content added in Phase 10) |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/companies.ts` | `experienceCreateSchema`, `experienceFilterSchema` |
| `src/schemas/clubs.ts` | `clubReviewSchema`, `clubListQuerySchema` |
| `src/schemas/roadmaps.ts` | `roadmapCreateSchema`, `roadmapStepSchema` |

### Web

| File | Purpose |
|---|---|
| `src/features/companies/*` | `CompaniesPage`, `CompanyPage`, `CompanyTile`, `RoundsTimeline`, `SkillsYouHave`, `ExperienceCard`, `ExperienceFilters`, `ExperienceForm` (+ steps), `api.ts` |
| `src/features/clubs/*` | `ClubsPage`, `ClubPage`, `ClubCard`, `RatingMeter`, `ReviewForm`, `api.ts` |
| `src/features/twins/*` | `PathTwinsPage`, `PathTimeline` (shared with profile Journey), `api.ts` |
| `src/features/roadmaps/*` | `RoadmapsPage`, `RoadmapPage`, `RoadmapNewPage`, `RoadmapCard`, `StepList`, `GoalTrackPicker`, `api.ts` |
| `src/features/onboarding/steps/StepGoals.tsx`, `src/features/profile/ProfileEditPage.tsx` | Target companies from `GET /companies` |

---

## 4. Step-by-step — API

### Step 1 — Schemas (5 min)

`packages/shared/src/schemas/companies.ts`:

```ts
import { z } from 'zod';
const thisYear = new Date().getFullYear();

export const experienceRoundSchema = z.object({
  name: z.string().trim().min(2, 'Name this round').max(60),               // e.g. "Online assessment"
  type: z.enum(['APTITUDE', 'CODING', 'CS_FUNDAMENTALS', 'TECHNICAL', 'HR']),
  topics: z.array(z.string().trim().toLowerCase().min(1).max(40)).min(1, 'Add at least one topic').max(10),
  difficulty: z.number().int().min(1).max(5),
  notes: z.string().trim().max(600).default(''),
});

export const experienceCreateSchema = z.object({
  companyId: z.string().uuid(),
  role: z.string().trim().min(2).max(60),
  year: z.number().int().min(thisYear - 4).max(thisYear),
  rounds: z.array(experienceRoundSchema).min(1, 'Add at least one round').max(8),
  difficulty: z.number().int().min(1).max(5),
  prepWeeks: z.number().int().min(0).max(104).optional(),
  resources: z.array(z.string().trim().min(2).max(200)).max(10).default([]),
  tips: z.string().trim().max(1500).default(''),
  outcome: z.enum(['SELECTED', 'NOT_SELECTED', 'WITHHELD']).default('WITHHELD'),
  confidentialityAck: z.literal(true, { errorMap: () => ({ message: 'Please confirm' }) }), // ⚠️ zod v4 syntax differs
});

export const experienceFilterSchema = z.object({
  year: z.coerce.number().int().optional(),
  role: z.string().optional(),
  minDifficulty: z.coerce.number().int().min(1).max(5).optional(),
  roundType: z.enum(['APTITUDE', 'CODING', 'CS_FUNDAMENTALS', 'TECHNICAL', 'HR']).optional(),
});
```

`packages/shared/src/schemas/clubs.ts`:

```ts
export const clubReviewSchema = z.object({
  usefulness: z.number().int().min(1).max(5),
  timeCost: z.number().int().min(1).max(5),
  review: z.string().trim().min(20, 'Share a little more (20+ characters)').max(1000),
});
export const clubListQuerySchema = z.object({
  category: z.enum(['TECH', 'CULTURAL', 'SPORTS', 'ENTREPRENEURSHIP', 'SOCIAL']).optional(),
  sort: z.enum(['useful', 'light', 'az']).default('useful'),
});
```

`packages/shared/src/schemas/roadmaps.ts`:

```ts
export const roadmapStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(100),
  detail: z.string().trim().max(600).default(''),
  semester: z.number().int().min(1).max(8),
  kind: z.enum(['SKILL', 'PROJECT', 'RESOURCE', 'PRACTICE']).default('SKILL'),
  resources: z.array(z.string().trim().max(200)).max(5).default([]),
});
export const roadmapCreateSchema = z.object({
  goalTrack: z.enum(['PRODUCT', 'SERVICE', 'QUANT_FINANCE', 'RESEARCH', 'STARTUP', 'MS', 'MBA', 'UNDECIDED']),
  title: z.string().trim().min(8).max(120),
  summary: z.string().trim().max(800).default(''),
  steps: z.array(roadmapStepSchema).min(3, 'Add at least 3 steps').max(30),
  mistakes: z.array(z.string().trim().min(3).max(200)).max(8).default([]),
});
```

### Step 2 — Companies and experiences (15 min)

`companies.service.ts`:

```ts
export async function listCompanies(q?: string) {
  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
    include: { _count: { select: { experiences: { where: { isRemoved: false } } } } },
  });
  // Alumni count: users whose company contains the company name (cheap enough for ~20 companies)
  const alumniCounts = await Promise.all(companies.map((c) =>
    prisma.user.count({ where: { onboarded: true, role: { in: ['ALUMNI', 'SENIOR'] }, company: { contains: c.name, mode: 'insensitive' } } })));
  return companies.map((c, i) => ({
    id: c.id, slug: c.slug, name: c.name, description: c.description, roles: c.roles, visitMonth: c.visitMonth,
    experienceCount: c._count.experiences, alumniCount: alumniCounts[i],
  }));
}

export async function getCompany(slug: string, viewerId: string) {
  const [company, viewer] = await Promise.all([
    prisma.company.findUnique({ where: { slug } }),
    prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { skills: true, targetCompanies: true } }),
  ]);
  if (!company) throw notFound('Company not found');
  const have = company.skillsTested.filter((s) => viewer.skills.includes(s));
  const latest = await prisma.experience.findMany({
    where: { companyId: company.id, isRemoved: false }, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], take: 2,
    include: { author: { select: userLiteSelect } },
  });
  const stats = await prisma.experience.aggregate({ where: { companyId: company.id, isRemoved: false }, _avg: { difficulty: true, prepWeeks: true }, _count: true });
  return {
    ...company,
    skills: { tested: company.skillsTested, have, missing: company.skillsTested.filter((s) => !have.includes(s)) },
    isTarget: viewer.targetCompanies.includes(company.slug),
    stats: { experiences: stats._count, avgDifficulty: stats._avg.difficulty, avgPrepWeeks: stats._avg.prepWeeks },
    latestExperiences: latest.map(toExperienceCard),
  };
}

export async function listExperiences(slug: string, f: ExperienceFilter) {
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) throw notFound();
  const rows = await prisma.experience.findMany({
    where: {
      companyId: company.id, isRemoved: false,
      ...(f.year ? { year: f.year } : {}),
      ...(f.role ? { role: { contains: f.role, mode: 'insensitive' } } : {}),
      ...(f.minDifficulty ? { difficulty: { gte: f.minDifficulty } } : {}),
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: userLiteSelect } },
  });
  // roundType filter on JSON: filter in memory (small data)
  return rows.filter((r) => !f.roundType || (r.rounds as any[]).some((x) => x.type === f.roundType)).map(toExperienceCard);
}

export async function companyAlumni(slug: string, viewerId: string) {
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) throw notFound();
  return discoverPeople(viewerId, { company: company.name, mode: 'all', sort: 'match', limit: 24, skills: [], interests: [] } as any);
}
```

`toExperienceCard(e)` returns: `id, role, year, rounds, difficulty, prepWeeks, resources, tips, outcome (hide WITHHELD → null), isVerified, createdAt, author (lite)`.

Routes: `GET /companies?q=`, `GET /companies/:slug`, `GET /companies/:slug/experiences`, `GET /companies/:slug/alumni`.

`experiences.service.ts`:

```ts
export async function createExperience(userId: string, input: ExperienceCreateInput) {
  const author = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, currentYear: true } });
  if (author.role === 'STUDENT' && (author.currentYear ?? 1) === 1)
    throw forbidden('Interview experiences are shared by students who have been through a process');
  const company = await prisma.company.findUnique({ where: { id: input.companyId } });
  if (!company) throw badRequest('Choose a company');
  const { confidentialityAck, ...data } = input;
  return prisma.$transaction(async (tx) => {
    const exp = await tx.experience.create({
      data: { ...data, authorId: userId, rounds: data.rounds.map((r) => ({ ...r, topics: [...new Set(r.topics.map(normalizeTag))] })) },
    });
    const earned = await awardPoints(tx, userId, 'EXPERIENCE', POINTS.EXPERIENCE, exp.id);
    await evaluateBadges(tx, userId);
    return { experience: exp, companySlug: company.slug, pointsEarned: earned ? POINTS.EXPERIENCE : 0 };
  });
}
```

Routes: `POST /experiences` (`validate`, `writeLimiter`), `GET /experiences/:id`.

### Step 3 — Clubs (8 min)

```ts
export async function listClubs(q: ClubListQuery) {
  const clubs = await prisma.club.findMany({ where: q.category ? { category: q.category } : {}, include: { reviews: { select: { usefulness: true, timeCost: true } } } });
  const rows = clubs.map(({ reviews, ...c }) => ({
    ...c,
    reviewCount: reviews.length,
    usefulness: reviews.length ? round1(avg(reviews.map((r) => r.usefulness))) : null,
    timeCost: reviews.length ? round1(avg(reviews.map((r) => r.timeCost))) : null,
  }));
  const sorters = {
    useful: (a: any, b: any) => (b.usefulness ?? 0) - (a.usefulness ?? 0) || b.reviewCount - a.reviewCount,
    light: (a: any, b: any) => (a.timeCost ?? 9) - (b.timeCost ?? 9),
    az: (a: any, b: any) => a.name.localeCompare(b.name),
  };
  return rows.sort(sorters[q.sort]);
}

export async function getClub(slug: string, viewerId: string) {
  const club = await prisma.club.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { updatedAt: 'desc' }, include: { author: { select: userLiteSelect } } } },
  });
  if (!club) throw notFound();
  const members = await prisma.milestone.findMany({ // "seniors who were part of this club" from journeys
    where: { category: 'CLUB', title: { contains: club.name, mode: 'insensitive' } },
    take: 6, include: { user: { select: userLiteSelect } },
  });
  return { ...club, myReview: club.reviews.find((r) => r.authorId === viewerId) ?? null, members: members.map((m) => m.user), /* + averages */ };
}

export async function reviewClub(userId: string, slug: string, input: ClubReviewInput) {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, currentYear: true } });
  if (me.role === 'STUDENT' && (me.currentYear ?? 1) === 1) throw forbidden('Club reviews come from students who have been members for a while');
  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) throw notFound();
  return prisma.$transaction(async (tx) => {
    const review = await tx.clubReview.upsert({
      where: { clubId_authorId: { clubId: club.id, authorId: userId } },
      update: input, create: { ...input, clubId: club.id, authorId: userId },
    });
    const earned = await awardPoints(tx, userId, 'CLUB_REVIEW', POINTS.CLUB_REVIEW, review.id); // once per review row
    await evaluateBadges(tx, userId);
    return { review, pointsEarned: earned ? POINTS.CLUB_REVIEW : 0 };
  });
}
```

Routes: `GET /clubs`, `GET /clubs/:slug`, `PUT /clubs/:slug/review`.

### Step 4 — Path Twins (8 min)

`src/services/twins.ts` — implement `TRD.md` §11.3:

```ts
export async function findTwins(viewerId: string) {
  const v = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { department: true, interests: true, skills: true, goalTrack: true, currentYear: true } });
  const candidates = await prisma.user.findMany({
    where: { id: { not: viewerId }, onboarded: true, role: { in: ['SENIOR', 'ALUMNI'] }, milestones: { some: {} } },
    select: { ...userLiteSelect, interests: true, goalTrack: true, milestones: { orderBy: [{ yearOfStudy: 'asc' }, { createdAt: 'asc' }] } },
    take: 200,
  });
  const scored = candidates
    .filter((c) => c.milestones.length >= 3)
    .map((c) => {
      const reasons: string[] = [];
      let s = 0;
      if (v.department && v.department === c.department) { s += 35; reasons.push(`Same department (${c.department})`); }
      const j = jaccard(v.interests, c.interests);
      if (j > 0) { s += 35 * j; reasons.push(`Shared interests: ${v.interests.filter((i) => c.interests.includes(i)).slice(0, 2).map(titleCase).join(', ')}`); }
      if (goalMatches(v.goalTrack, c)) { s += 20; reasons.push(goalReason(v.goalTrack, c)); }
      const y1 = c.milestones.filter((m) => m.yearOfStudy === 1).length;
      s += 10 * Math.min(1, y1 / 2);
      return { person: c, score: Math.round(s), reasons };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const pool = scored.slice(0, 5).flatMap((t) => t.person.milestones.filter((m) => m.yearOfStudy === 1));
  const year1 = Object.entries(groupBy(pool, (m) => m.category))
    .map(([category, items]) => ({ category, count: items.length, examples: [...new Set(items.map((i) => i.title))].slice(0, 3) }))
    .sort((a, b) => b.count - a.count);

  return {
    startingPoint: { department: v.department, interests: v.interests, goalTrack: v.goalTrack, skills: v.skills, currentYear: v.currentYear },
    twins: top.map((t) => ({ ...t, milestonesByYear: groupBy(t.person.milestones, (m) => String(m.yearOfStudy)) })),
    year1,
  };
}
```

`goalMatches` / `goalReason` follow the table in `TRD.md` §11.3 (e.g. PRODUCT ↔ JOB milestone or company present: "Now at {company} — your goal"; STARTUP ↔ STARTUP milestone: "Founded a startup"). Write small helpers `groupBy`, `avg`, `round1` in `lib/text.ts` or `lib/collections.ts`.

Route: `GET /path-twins`.

### Step 5 — Roadmaps (10 min)

```ts
export async function listRoadmaps(viewerId: string, q: { goalTrack?: GoalTrack; mine?: boolean }) {
  const where: Prisma.RoadmapWhereInput = q.mine
    ? { OR: [{ authorId: viewerId }, { saves: { some: { userId: viewerId } } }] }
    : { isPublic: true, ...(q.goalTrack ? { goalTrack: q.goalTrack } : {}) };
  const rows = await prisma.roadmap.findMany({
    where, orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: userLiteSelect }, saves: { where: { userId: viewerId }, select: { completedSteps: true } } },
  });
  return rows.map(({ saves, steps, ...r }) => ({
    ...r, stepCount: (steps as any[]).length, saved: saves.length > 0,
    progress: saves[0] ? saves[0].completedSteps.length / Math.max(1, (steps as any[]).length) : 0,
  }));
}

export async function getRoadmap(viewerId: string, id: string) {
  const r = await prisma.roadmap.findUnique({ where: { id }, include: { author: { select: userLiteSelect }, saves: { where: { userId: viewerId } } } });
  if (!r || (!r.isPublic && r.authorId !== viewerId)) throw notFound();
  return { ...r, saved: r.saves.length > 0, completedSteps: r.saves[0]?.completedSteps ?? [] };
}

export async function createRoadmap(userId: string, input: RoadmapCreateInput) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.roadmap.create({ data: { ...input, authorId: userId, steps: input.steps as any } });
    const earned = await awardPoints(tx, userId, 'ROADMAP', POINTS.ROADMAP, r.id);
    await evaluateBadges(tx, userId);
    return { roadmap: r, pointsEarned: earned ? POINTS.ROADMAP : 0 };
  });
}

export async function toggleSave(userId: string, roadmapId: string) {
  const key = { userId_roadmapId: { userId, roadmapId } };
  const existing = await prisma.roadmapSave.findUnique({ where: key });
  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.roadmapSave.delete({ where: key });
      await tx.roadmap.update({ where: { id: roadmapId }, data: { saveCount: { decrement: 1 } } });
      return { saved: false };
    }
    await tx.roadmapSave.create({ data: { userId, roadmapId } });
    await tx.roadmap.update({ where: { id: roadmapId }, data: { saveCount: { increment: 1 } } });
    return { saved: true };
  });
}

export async function toggleStep(userId: string, roadmapId: string, stepId: string, done: boolean) {
  const save = await prisma.roadmapSave.upsert({ // ticking a step auto-saves the roadmap
    where: { userId_roadmapId: { userId, roadmapId } }, update: {}, create: { userId, roadmapId },
  });
  const set = new Set(save.completedSteps);
  done ? set.add(stepId) : set.delete(stepId);
  const updated = await prisma.roadmapSave.update({ where: { userId_roadmapId: { userId, roadmapId } }, data: { completedSteps: [...set] } });
  return { completedSteps: updated.completedSteps };
}
```

> When `toggleStep` creates the save via `upsert`, also increment `saveCount` (check `save.createdAt` is within the last second, or restructure: find first, create in a transaction with the counter if missing).

Routes: `GET /roadmaps?goalTrack=&mine=`, `GET /roadmaps/:id`, `POST /roadmaps`, `PUT /roadmaps/:id/save`, `PATCH /roadmaps/:id/steps/:stepId`.

### Step 6 — Seed content: experiences, reviews, roadmaps (5 min)

Create `scripts/seed-content.ts` (Phase 10 adds questions, posts, teams and stories to the same script). Use demo seniors/alumni as authors:

- **12–16 experiences** across at least 6 companies and 2–3 years, with realistic round types, topics (lowercase: "arrays", "dp", "dbms normalization", "os scheduling", "probability", "tell me about yourself"), difficulty and tips. Mark a few `isVerified: true`.
- **20 club reviews** from seniors/juniors (varied usefulness and time cost, honest one-paragraph reviews).
- **7 human roadmaps**, one per goal track (Product, Service, Quant/finance, Research, Startup, MS, MBA), each with 8–12 steps across semesters, `kind` set (SKILL / PROJECT / RESOURCE / PRACTICE), and 2–3 "mistakes I made".

Insert these **through the service functions** (or replicate their point awards) so authors get points and badges consistently. Make the script idempotent: delete previous seed content by a marker (e.g. authors with `@demo.bridgeup` emails) before inserting.

---

## 5. Step-by-step — Web

### Step 7 — Companies (15 min)

**`/companies`**: `PageHeader` "Companies that visit campus" / "Rounds, skills and real experiences from your seniors." Search input (client-side filter is fine). Grid of `CompanyTile`s (`sm:grid-cols-2 lg:grid-cols-3`): gradient initial logo (`gradientFor(slug)`), name, visit month pill, role chips, "12 experiences · 5 alumni"; a "Your target" amber ribbon when in `me.targetCompanies`.

**`/companies/:slug`** — header card: large logo, name, description, website link (if safe URL), role chips, stats row ("12 experiences · avg difficulty 3.4/5 · ~6 weeks prep"), buttons **Share your experience** (→ `/experiences/new?company=slug`; hidden for first years with a tooltip explanation), **Add to my targets** (toggle; updates `PUT /me/targets` in Phase 09 — for now `PATCH /me/profile` with `targetCompanies`), **Bookmark** (company bookmarks are optional; skip if short on time).

Tabs (URL hash):

1. **Overview**
   - `RoundsTimeline`: horizontal stepper on desktop (numbered circles connected by a line, round name, type pill, one-line description), vertical on mobile.
   - `SkillsYouHave`: "Skills tested — you have 4 of 7" with a progress bar; chips with ✓ (emerald) for skills the viewer has and ○ (muted) for missing ones; link "Plan the missing skills" → `/roadmaps/generate?company=slug` (Phase 09).
   - "Latest experiences" (2 cards) + "See all".
   - Slot: AI summary of experiences (Phase 09).
2. **Experiences** — filters (year, role, min difficulty, round type) as compact selects; `ExperienceCard` list with anchors `id="exp-{id}"` so search deep links work (scroll into view on load when the hash matches).
3. **Alumni** — person cards (from `/companies/:slug/alumni`) with match ring and Connect; empty state "No alumni here yet — invite them!" (admins can invite in Phase 08).
4. **Prep roadmap** — the company's `prepRoadmap` as a checklist grouped by category (OA · Aptitude · Technical · HR) with an **Add to my prep** button (Phase 09 imports them into the dashboard; until then show the list read-only).

**`ExperienceCard`**:
- Header: author avatar + name + role badge (or "Anonymous senior" is **not** offered — accountability matters), role applied for, year, `SelfReportedBadge` or `VerifiedBadge`, difficulty dots (5 small circles, filled amber), outcome pill if shared (Selected emerald / Not selected grey).
- `Accordion` of rounds: round name, type pill, difficulty dots, topic chips, notes.
- Prep: "Prepared for ~6 weeks", resources as a list (links only if safe URLs), tips in a soft amber callout ("Tip from Rahul").
- Footer: Bookmark, Report, "Ask {firstName} about this" (Connect dialog, kind MENTORSHIP, topic prefilled "Your {company} {role} experience").

**`/experiences/new`** — `ExperienceForm`, 4 steps with a progress bar (same pattern as onboarding):
1. **Basics:** company (`Select`, prefilled from `?company=`), role, year, overall difficulty (5 tappable dots).
2. **Rounds:** `useFieldArray` list; each round card: name, type select, topics `ChipPicker` (free entry), difficulty dots, notes; "Add round" button; reorder with up/down buttons.
3. **Preparation:** weeks of prep (number), resources (list input), tips (textarea with prompt "What would you tell a junior?").
4. **Outcome & privacy:** outcome radio (Selected / Not selected / Prefer not to say), callout: "Your experience will be labelled *Self-reported* unless verified by an admin. Don't share questions you agreed to keep confidential.", required checkbox "I confirm this doesn't break any confidentiality agreement".
- Submit → toast "+20 helpfulness — thank you for helping juniors!" → navigate to `/companies/{slug}#exp-{id}`.

### Step 8 — Clubs (8 min)

**`/clubs`**: `PageHeader` "Clubs" / "Honest ratings from seniors: how useful, and how much time." Category chips (All · Tech · Cultural · Sports · Entrepreneurship · Social), sort select (Most useful · Lightest time · A–Z). Grid of `ClubCard`: name, category pill, one-line description, two `RatingMeter`s, skills gained chips, review count, "Recruits in {month}" pill — amber highlighted with "Recruiting this week" if a CLUB event in This Week mentions the club name.

**`RatingMeter`** (`label`, `value` 1–5 or null, `tone`): label + value ("Usefulness 4.3"), 5-segment bar (segments filled proportionally; usefulness emerald, time cost amber); "No reviews yet" when null. Add a tooltip: "Time cost: 1 = light, 5 = very demanding".

**`/clubs/:slug`**: header (name, category, description, time commitment, join link button if safe URL), rating summary (two large meters + review count), skills gained, "Seniors who were members" avatars (from journeys) with Connect, reviews list (author, role/year, both ratings as small meters, text, date), `ReviewForm` (two 1–5 segmented selectors with labels "Not useful → Very useful" / "Light → Very demanding", textarea, submit; shows "Edit your review" if one exists). First years see an info card instead of the form: "Reviews come from students who've been members — ask them questions instead!" with a button to `/ask/new?topic=campus-life`.

On mount, add the slug to `localStorage['bu-visited-clubs']` (JSON array, unique, try/catch) and invalidate `qk.rail` for the quest.

### Step 9 — Path Twins (8 min)

**`/path-twins`**:
- `PageHeader` "Path Twins" / "People who started where you are — and where they went."
- **Your starting point** card: department, year, interests chips, goal track, skills chips; link "Not right? Update your profile".
- **Twins** — 3 cards stacked (or tabs on mobile). Each: header (avatar, name, role badge, "Now: ML Engineer @ Northwind Labs" or "Final year"), twin score as a small `MatchRing`, reason chips; then `PathTimeline`.
- **`PathTimeline`** (the "wow" visual, also used on profiles): 5 columns on desktop — Year 1 · Year 2 · Year 3 · Year 4 · After college — each a vertical stack of milestone chips with category icon and colour; a thin horizontal line across the column headers with dots; columns animate in with a 60 ms stagger. On mobile, a vertical timeline grouped by year.
- Card footer: **Ask {firstName} about this path** (Connect dialog, kind MENTORSHIP, topic prefilled) and **Turn this into my roadmap** (→ `/roadmaps/generate?track={goalTrack}` — Phase 09; until then `/roadmaps?goal={goalTrack}`).
- **What your twins did in Year 1**: a card with category rows ("Joined a club — 4 of 5 twins: coding club, robotics club…", "Built a first project — 3 of 5 twins…").
- Empty state if no twins: "We're still collecting journeys — invite seniors to add theirs" with a share link.

### Step 10 — Roadmaps (8 min)

**`/roadmaps`**: `PageHeader` "Roadmaps" / "Real paths from seniors who reached your goal." with buttons **Generate my roadmap** (Phase 09; for now hidden or `ComingNext`) and **Share your roadmap** (→ `/roadmaps/new`, shown to seniors/alumni prominently and to others as a secondary link).
- `GoalTrackPicker`: 7 cards (icon, label) — Product company job · Service company job · Quant or finance · Research · Build a startup · MS / higher studies · MBA — selecting filters the list (`?goal=`).
- Tab toggle: **Explore** / **My roadmaps** (`mine=true`: authored or saved).
- `RoadmapCard`: goal pill, title, author (avatar, role badge) or "AI · personal" badge, step count, saves, progress bar if saved.

**`/roadmaps/:id`**: header (goal pill, title, author with Connect, summary, saves, Save / Saved toggle), progress bar ("4 of 11 steps") when saved; `StepList` grouped by semester ("Semester 1", …) — each step: checkbox (auto-saves the roadmap), kind icon (Skill brain, Project hammer, Resource book, Practice target), title, detail, resources as links; completed steps get strike-through and a subtle emerald check. A "Mistakes I made" amber callout list at the end (human roadmaps). Gaps card for AI roadmaps (Phase 09).

**`/roadmaps/new`**: goal track picker, title (placeholder "How I got my first SDE internship in 4 months"), summary, steps editor (`useFieldArray`: title, detail, semester select, kind select, resources list; default 3 empty steps; add/remove/reorder), mistakes list. Submit → "+20 helpfulness" toast → detail page.

### Step 11 — Target companies in onboarding and profile (2 min)

Replace the static list in `StepGoals` and the profile edit page with a multi-select fed by `GET /companies` (name shown, slug stored).

Commit:

```bash
git add -A && git commit -m "phase-06: companies, experiences, clubs, path twins, roadmaps" && git tag phase-06
```

---

## 6. UI quality checklist

- [ ] Company page feels like a prep hub: clear tabs, a real timeline visual, and "skills you have vs need" at a glance.
- [ ] Experience cards are scannable: difficulty dots, round accordion, topic chips, tip callout.
- [ ] "Self-reported" is visible but not alarming (grey outline with tooltip).
- [ ] Club meters are readable without hovering (labels + numbers).
- [ ] Path Twins timeline is polished: aligned columns, colour-coded categories, smooth stagger, and a clean mobile version.
- [ ] Roadmap steps tick instantly (optimistic) and progress animates.
- [ ] Every form shows inline errors and points-earned toasts.

---

## 7. Completion criteria

- [ ] At least 6 companies have experiences; filters work, including round type.
- [ ] The experience form validates every step and saves rounds as JSON with normalised topics; first years can't submit (403 + UI hint).
- [ ] Club averages update after a new or edited review; one review per user per club.
- [ ] Path Twins shows 3 twins with reasons and timelines for Ananya.
- [ ] Roadmap save and step ticking persist across reloads; save counts are correct.
- [ ] Points and badges are awarded for experiences, reviews and roadmaps (check `PointsLedger`).

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 6.1 | `/companies` → type part of a company name | Grid filters instantly |
| 6.2 | Open a company → Overview as Ananya (skills: python) | Rounds timeline; "you have 1 of 7" with ✓ on python |
| 6.3 | Experiences tab → min difficulty 4 + round type CODING | Only matching cards |
| 6.4 | Alumni tab | People whose company matches, with match rings; Connect works |
| 6.5 | As Ananya open `/experiences/new` | Blocked with an explanation (first year) |
| 6.6 | As Rahul submit an experience with 2 rounds | Redirect to the card anchor; "+20" toast; Experience Sharer badge notification row |
| 6.7 | Submit with a round missing topics | Step 2 error "Add at least one topic" |
| 6.8 | As Rahul review a club (4 useful, 2 time), then edit to (5, 2) | One review row; averages update on `/clubs`; points awarded once |
| 6.9 | As Ananya open a club page | No form; first-year info card; club slug added to `bu-visited-clubs` |
| 6.10 | Visit 3 different clubs as Ananya, go home | "Explore 3 clubs" quest ticked |
| 6.11 | `/path-twins` as Ananya | 3 twins with reasons, 5 year columns, "What your twins did in Year 1" |
| 6.12 | `/roadmaps` → choose "MBA" | Only MBA roadmaps |
| 6.13 | Open a roadmap, tick 2 steps, reload | Roadmap saved automatically; progress 2/N persists; save count +1 |
| 6.14 | Create a roadmap as Rahul | "+20" toast; Roadmap Author badge |
| 6.15 | Ctrl+K → search a topic word used in an experience | Experience result deep-links and scrolls to the card |
| 6.16 | Mobile 375px company page and Path Twins | Vertical timelines; tabs scroll; nothing overflows |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Unique constraint failed on clubId_authorId` | Use `upsert` for reviews (as above) |
| Experience topics not matching search | Normalise topics to lowercase in the service |
| Path Twins empty | Seniors/alumni need ≥ 3 milestones and `onboarded = true` |
| Roadmap `steps` typing errors | Cast JSON with a zod parse (`z.array(roadmapStepSchema).parse(r.steps)`) when reading |

---

## 10. If you're behind

- Skip the Alumni tab (show "Alumni at this company" as 3 avatars in Overview).
- Skip roadmap creation (keep seeded roadmaps + save/tick).
- Show only one Path Twin, and skip "What your twins did in Year 1".
- Keep: company pages with rounds, skills you have, experiences with filters, the experience form, clubs with meters and reviews.
