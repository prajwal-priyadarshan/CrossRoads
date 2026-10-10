# Phase 03 — Profiles, Discover People, Smart Matching, Find My Alumni Mentor and requests

| | |
|---|---|
| **Time box** | 1:05 (cumulative 3:40) |
| **Goal** | People-first profiles (including alumni profiles), Discover People with filters and explained match scores, "Find my alumni mentor" mode, and connection / mentorship / collaboration / peer-guidance requests with accept, decline and tracking |
| **Prerequisites** | Phase 02 complete |
| **PRD features** | F03 Profiles, F04 Alumni profiles, F05 Discover People, F06 Smart Matching, F07 Find My Alumni Mentor, F08 Requests |
| **Requirements** | FR-PROF-1…3, FR-PPL-1…4, FR-REQ-1…4; your Modules A, B, C; numbered feature 2; placement feature 4 |
| **Reference** | `TRD.md` §11.1 (matching), §8.2–8.3 (endpoints), §14 (contact privacy) |


> **Implementation notes (verified build).**
> - Project-text matching uses whole-term matching (`mentions()` in `services/matching.ts`); a plain `includes` made the skill "c" match almost every project.
> - lucide-react no longer ships brand icons; GitHub and LinkedIn icons are small inline SVGs in `components/shared/BrandIcons.tsx`.
> - Services type rows with `Prisma.UserGetPayload<{ select: … }>` instead of `as any`; `asMatchProfile()` lives in `users.serializers.ts`.
> - `seed-users.ts` keeps already-earned points (base points + `PointsLedger` sum) so re-seeding never drifts totals.

---

## 1. What you will have at the end of this phase

- 30 seeded demo users with realistic, varied profiles and journeys (so matching, Path Twins and the demo have data).
- `GET /people` with SQL filters + in-memory scoring; `GET /people/suggested`.
- Public profile page `/u/:handle` with all sections and visibility rules applied **on the server**.
- Profile edit page `/settings/profile` including projects, achievements, journey milestones and mentoring preferences.
- `/people` page with filters, "Top matches for you", "Find my alumni mentor" mode, match rings and reason chips.
- Connect dialog with four request types; `/requests` page with Incoming / Outgoing / Completed tabs.

---

## 2. Concepts in this phase

- **Explainable matching.** Every point in the score comes from a named rule, and each rule produces a human-readable reason. The UI shows the top reasons, so users trust the suggestion.
- **Filter in SQL, rank in memory.** SQL narrows the candidates cheaply (indexes on role, department, arrays); TypeScript scores at most ~300 rows. That's fast for one campus and keeps the logic readable.
- **Privacy on the server.** The profile serializer removes email/LinkedIn/GitHub unless the owner allowed them. Hiding in the UI alone is not privacy.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `scripts/seed-users.ts` | 30 demo users + milestones + projects |
| `scripts/data/users.ts` | The demo user definitions |
| `src/services/matching.ts` | `scoreMatch`, `rankPeople` (`TRD.md` §11.1) |
| `src/modules/users/users.serializers.ts` | `toUserLite`, `toPublicProfile(user, viewer)` |
| `src/modules/users/users.service.ts` | `updateProfile`, `getPublicProfile`, `addMilestone`, `deleteMilestone` |
| `src/modules/users/users.routes.ts` | `PATCH /me/profile`, `GET /users/:handle`, milestones |
| `src/modules/people/people.service.ts` | `discoverPeople`, `suggestedPeople` |
| `src/modules/people/people.routes.ts` | `GET /people`, `GET /people/suggested` |
| `src/modules/connections/connections.service.ts` | `createRequest`, `listRequests`, `respond`, `complete`, `updateFollowUps` |
| `src/modules/connections/connections.routes.ts` | Routes |
| `src/services/notify.ts` | `notify`, `notifyMany` (`TRD.md` §10.2) |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/profile.ts` | Add `profileUpdateSchema`, `milestoneSchema`, `projectSchema` |
| `src/schemas/people.ts` | `peopleQuerySchema` |
| `src/schemas/connections.ts` | `connectionCreateSchema`, `connectionRespondSchema`, `followUpsSchema`, `completeSchema` |
| `src/types.ts` | `PersonCard`, `PublicProfile`, `ConnectionRow` |

### Web

| File | Purpose |
|---|---|
| `src/features/people/api.ts` | `usePeople`, `useSuggestedPeople` |
| `src/features/people/PeoplePage.tsx` | Page |
| `src/features/people/PeopleFilters.tsx` | Filter panel / sheet |
| `src/features/people/PersonCard.tsx` | Card |
| `src/features/people/ConnectDialog.tsx` | Request dialog (used everywhere) |
| `src/features/profile/api.ts` | `useProfile`, `useUpdateProfile`, `useAddMilestone`, `useDeleteMilestone` |
| `src/features/profile/ProfilePage.tsx` | Public profile |
| `src/features/profile/ProfileEditPage.tsx` | Edit form with tabs |
| `src/features/profile/ProjectsEditor.tsx`, `JourneyEditor.tsx`, `JourneyTimeline.tsx` | Sub-editors and the timeline view |
| `src/features/requests/api.ts` | `useConnections`, `useCreateConnection`, `useRespond`, `useComplete`, `useFollowUps` |
| `src/features/requests/RequestsPage.tsx`, `RequestRow.tsx`, `FollowUps.tsx` | Requests page |
| `src/router.tsx` | Add `/people`, `/u/:handle`, `/me`, `/settings/profile`, `/requests` |

---

## 4. Step-by-step — API

### Step 1 — Seed 30 demo users (12 min)

`scripts/data/users.ts` — define users in plain objects. **All demo emails end with `@demo.bridgeup`** and are inserted into `AllowedEmail` first (so they pass the domain rule and alumni get the right role).

Mix (aim for realistic variety):

| Group | Count | Notes |
|---|---|---|
| First years | 7 | Mixed departments; few skills; interests set; looking for mentorship/teammates; **Ananya** (`handle: ananya`) is one |
| Second/third years | 8 | Projects, a couple of internships in milestones; **Karthik** (`karthik`, 3rd year) preparing for placements |
| Final-year seniors | 7 | Placed or interning; can help with interview prep, DSA, clubs; **Rahul** (`rahul`, computer vision, placed at a product company from your seed list) |
| Alumni | 7 | At seeded companies (`company` matches a seed company name), mentor available, mentor topics and slots; **Meera** (`meera`, ML engineer at a seeded product company); 1–2 founders (STARTUP milestones, can help with startups) |
| Admin | — | already seeded (`admin`) |

Each senior/alumnus gets **6–10 milestones** across years 1–5 (club joined, first project, hackathon, internship, course, job/startup), 1–3 **projects** (`{ title, description, url }` with text that mentions skills like "computer vision"), and `isVerified: true`.

Sample entry:

```ts
{
  handle: 'rahul', fullName: 'Rahul Menon', email: 'rahul@demo.bridgeup', role: 'SENIOR', currentYear: 4, batchYear: 2027,
  department: 'CSE-AI', bio: 'Final year. Love computer vision and helping juniors start ML the right way.',
  skills: ['python', 'computer vision', 'deep learning', 'dsa', 'sql'], interests: ['ai/ml', 'research', 'competitive programming'],
  targetRoles: ['ml engineer'], goalTrack: 'PRODUCT', canHelpWith: ['interview prep', 'dsa', 'internships', 'projects', 'club guidance'],
  lookingFor: ['teammates'], mentorAvailable: true, mentorTopics: ['ml projects', 'internship prep'], mentorSlots: 'Sat 5–6 pm',
  linkedinUrl: 'https://www.linkedin.com/in/demo-rahul', githubUrl: 'https://github.com/demo-rahul', showLinkedin: true, showGithub: true,
  projects: [{ title: 'Helmet detection for campus gates', description: 'Real-time computer vision model with YOLO, deployed on a Jetson.' }],
  milestones: [
    { yearOfStudy: 1, category: 'CLUB', title: 'Joined the coding club' },
    { yearOfStudy: 1, category: 'COURSE', title: 'Finished a Python and DSA basics course' },
    { yearOfStudy: 2, category: 'PROJECT', title: 'Built a face-attendance system' },
    { yearOfStudy: 2, category: 'ACHIEVEMENT', title: 'Top 10 at the campus hackathon' },
    { yearOfStudy: 3, category: 'INTERNSHIP', title: 'Computer vision intern at Northwind Labs' },
    { yearOfStudy: 4, category: 'JOB', title: 'Placed as ML engineer at Northwind Labs' },
  ],
}
```

> Use fictional people. Don't copy real students' or alumni's details without consent.

`scripts/seed-users.ts`:

```ts
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { users } from './data/users';

const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'demo12345';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  for (const u of users) {
    await prisma.allowedEmail.upsert({ where: { email: u.email }, update: { role: u.role === 'ALUMNI' ? 'ALUMNI' : 'STUDENT' }, create: { email: u.email, role: u.role === 'ALUMNI' ? 'ALUMNI' : 'STUDENT' } });
    const { milestones = [], ...data } = u;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...data, onboarded: true, emailVerified: true },
      create: { ...data, passwordHash, onboarded: true, emailVerified: true, isVerified: u.role === 'SENIOR' || u.role === 'ALUMNI', consentAt: new Date() },
    });
    await prisma.milestone.deleteMany({ where: { userId: user.id } });
    if (milestones.length) await prisma.milestone.createMany({ data: milestones.map((m) => ({ ...m, userId: user.id })) });
  }
  // Admin should be demo-loginable
  await prisma.user.updateMany({ where: { handle: 'admin' }, data: { email: 'admin@demo.bridgeup' } });
  console.log(`Seeded ${users.length} users`);
}
main().finally(() => prisma.$disconnect());
```

Run `npm run seed:users -w apps/api`. Topic follows for demo users are added in Phase 04's seed step (topics exist already; you can add them here: give every user 2–3 follows matching their interests).

### Step 2 — Schemas (5 min)

`packages/shared/src/schemas/profile.ts` (add):

```ts
export const projectSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(''),
  url: z.string().trim().url().regex(/^https?:\/\//).optional().or(z.literal('')),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(280).default(''),
  department: z.string().min(1),
  batchYear: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 6),
  company: z.string().trim().max(80).optional().or(z.literal('')),
  jobTitle: z.string().trim().max(80).optional().or(z.literal('')),
  skills: z.array(tag).max(20),
  interests: z.array(tag).max(12),
  targetRoles: z.array(tag).max(5),
  targetCompanies: z.array(z.string()).max(8),
  goalTrack: stepGoalsSchema.shape.goalTrack,
  canHelpWith: z.array(tag).max(10),
  lookingFor: z.array(tag).max(10),
  projects: z.array(projectSchema).max(8),
  achievements: z.array(z.string().trim().min(2).max(120)).max(10),
  linkedinUrl: url,
  githubUrl: url,
  showEmail: z.boolean(),
  showLinkedin: z.boolean(),
  showGithub: z.boolean(),
  mentorAvailable: z.boolean(),
  mentorTopics: z.array(tag).max(8),
  mentorSlots: z.string().trim().max(120).default(''),
  showOnMentorWall: z.boolean(),
}).partial(); // every field optional so sections can be saved independently

export const milestoneSchema = z.object({
  yearOfStudy: z.number().int().min(1).max(5),
  category: z.enum(['CLUB', 'PROJECT', 'INTERNSHIP', 'COURSE', 'ACHIEVEMENT', 'JOB', 'STARTUP']),
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(300).default(''),
});
```

> Note: `role`, `points`, `isVerified`, `email`, `currentYear` are **not** in `profileUpdateSchema`, so they can never be changed through it. (Changing year/status is an admin action or a fresh onboarding — out of scope.)

`packages/shared/src/schemas/people.ts`:

```ts
import { z } from 'zod';
const csv = z.string().optional().transform((s) => (s ? s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) : []));

export const peopleQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  department: z.string().optional(),
  role: z.enum(['STUDENT', 'SENIOR', 'ALUMNI']).optional(),
  year: z.coerce.number().int().min(1).max(5).optional(),
  batch: z.coerce.number().int().optional(),
  skills: csv, interests: csv, targetRole: z.string().optional(), company: z.string().optional(),
  mentorAvailable: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  mode: z.enum(['all', 'mentor']).default('all'),
  sort: z.enum(['match', 'helpful', 'newest']).default('match'),
  limit: z.coerce.number().int().min(1).max(60).default(30),
});
```

`packages/shared/src/schemas/connections.ts`:

```ts
import { z } from 'zod';
export const connectionCreateSchema = z
  .object({
    recipientId: z.string().uuid(),
    kind: z.enum(['CONNECT', 'MENTORSHIP', 'COLLAB', 'PEER_GUIDANCE']),
    message: z.string().trim().min(10, 'Write at least 10 characters').max(500),
    topic: z.string().trim().max(160).optional(),
  })
  .refine((v) => !['MENTORSHIP', 'PEER_GUIDANCE'].includes(v.kind) || (v.topic && v.topic.length >= 5), {
    message: 'Add the specific question you want help with', path: ['topic'],
  });
export const connectionRespondSchema = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) });
export const completeSchema = z.object({ sessionNote: z.string().trim().max(500).optional() });
export const followUpsSchema = z.object({
  followUps: z.array(z.object({ id: z.string(), text: z.string().trim().min(2).max(160), done: z.boolean() })).max(10),
});
```

### Step 3 — Serializers and profile endpoints (10 min)

`src/modules/users/users.serializers.ts`:

```ts
import type { User } from '@prisma/client';

export const userLiteSelect = {
  id: true, handle: true, fullName: true, avatarUrl: true, role: true, currentYear: true, department: true,
  company: true, jobTitle: true, isVerified: true,
} as const;

/** Applies the owner's visibility choices. Accepted connections don't override them. */
export function toPublicProfile(u: User & { milestones?: any[] }, viewerId: string) {
  const isOwner = u.id === viewerId;
  return {
    id: u.id, handle: u.handle, fullName: u.fullName, avatarUrl: u.avatarUrl, role: u.role, department: u.department,
    batchYear: u.batchYear, currentYear: u.currentYear, company: u.company, jobTitle: u.jobTitle, bio: u.bio,
    skills: u.skills, interests: u.interests, targetRoles: u.targetRoles, goalTrack: u.goalTrack,
    canHelpWith: u.canHelpWith, lookingFor: u.lookingFor, projects: u.projects, achievements: u.achievements,
    mentorAvailable: u.mentorAvailable, mentorTopics: u.mentorTopics, mentorSlots: u.mentorSlots, isVerified: u.isVerified,
    milestones: u.milestones ?? [],
    email: isOwner || u.showEmail ? u.email : null,
    linkedinUrl: isOwner || u.showLinkedin ? u.linkedinUrl : null,
    githubUrl: isOwner || u.showGithub ? u.githubUrl : null,
    // points are public only for seniors/alumni (wellbeing rule); owner always sees their own
    points: isOwner || u.role === 'SENIOR' || u.role === 'ALUMNI' ? u.points : null,
    isOwner,
  };
}
```

`users.service.ts` (add):

```ts
export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const uniq = (xs?: string[]) => (xs ? [...new Set(xs.map(normalizeTag).filter(Boolean))] : undefined);
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      skills: uniq(input.skills), interests: uniq(input.interests), targetRoles: uniq(input.targetRoles),
      canHelpWith: uniq(input.canHelpWith), lookingFor: uniq(input.lookingFor), mentorTopics: uniq(input.mentorTopics),
      company: input.company === '' ? null : input.company,
      jobTitle: input.jobTitle === '' ? null : input.jobTitle,
      linkedinUrl: input.linkedinUrl === '' ? null : input.linkedinUrl,
      githubUrl: input.githubUrl === '' ? null : input.githubUrl,
    },
  });
}

export async function getPublicProfile(handle: string, viewer: { id: string }) {
  const [user, me] = await Promise.all([
    prisma.user.findUnique({ where: { handle }, include: { milestones: { orderBy: [{ yearOfStudy: 'asc' }, { createdAt: 'asc' }] } } }),
    prisma.user.findUniqueOrThrow({ where: { id: viewer.id } }),
  ]);
  if (!user || !user.onboarded) throw notFound('Profile not found');
  const profile = toPublicProfile(user, viewer.id);
  const match = user.id === me.id ? null : scoreMatch(asMatchProfile(me), asMatchProfile(user));
  const connection = await prisma.connection.findFirst({
    where: { OR: [{ requesterId: me.id, recipientId: user.id }, { requesterId: user.id, recipientId: me.id }] },
    orderBy: { createdAt: 'desc' },
    select: { id: true, kind: true, status: true, requesterId: true },
  });
  return { ...profile, match, connection };
}
```

`asMatchProfile(u)` maps a Prisma user to the `P` type in `matching.ts` (cast `projects` JSON to an array, default `[]`).

Routes in `users.routes.ts`:

```ts
usersRouter.patch('/me/profile', requireOnboarded, validate({ body: profileUpdateSchema }), async (req, res) =>
  res.json({ data: toMe(await updateProfile(req.user!.id, req.valid.body)) }));

usersRouter.get('/users/:handle', requireOnboarded, async (req, res) =>
  res.json({ data: await getPublicProfile(req.params.handle, req.user!) }));

usersRouter.post('/me/milestones', requireOnboarded, validate({ body: milestoneSchema }), async (req, res) =>
  res.status(201).json({ data: await prisma.milestone.create({ data: { ...req.valid.body, userId: req.user!.id } }) }));

usersRouter.delete('/me/milestones/:id', requireOnboarded, async (req, res) => {
  const r = await prisma.milestone.deleteMany({ where: { id: req.params.id, userId: req.user!.id } }); // owner-only
  if (!r.count) throw notFound();
  res.json({ data: { ok: true } });
});
```

### Step 4 — Matching and people endpoints (12 min)

1. Create `src/services/matching.ts` from `TRD.md` §11.1 (and `lib/text.ts` if not done).
2. `src/modules/people/people.service.ts`:

```ts
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { rankPeople } from '../../services/matching';
import { userLiteSelect } from '../users/users.serializers';

const matchSelect = {
  ...userLiteSelect, skills: true, interests: true, targetRoles: true, targetCompanies: true, canHelpWith: true, lookingFor: true,
  projects: true, mentorAvailable: true, mentorTopics: true, mentorSlots: true, points: true, createdAt: true, batchYear: true,
} as const;

export async function discoverPeople(viewerId: string, q: PeopleQuery) {
  const viewer = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: matchSelect });

  const where: Prisma.UserWhereInput = { onboarded: true, id: { not: viewerId }, role: { not: 'ADMIN' } };
  if (q.mode === 'mentor') { where.role = { in: ['ALUMNI', 'SENIOR'] }; where.mentorAvailable = true; }
  if (q.role) where.role = q.role;
  if (q.department) where.department = q.department;
  if (q.year) where.currentYear = q.year;
  if (q.batch) where.batchYear = q.batch;
  if (q.skills.length) where.skills = { hasSome: q.skills };
  if (q.interests.length) where.interests = { hasSome: q.interests };
  if (q.targetRole) where.OR = [{ targetRoles: { has: q.targetRole } }, { jobTitle: { contains: q.targetRole, mode: 'insensitive' } }];
  if (q.company) where.company = { contains: q.company, mode: 'insensitive' };
  if (q.mentorAvailable) where.mentorAvailable = true;
  if (q.q) {
    // simple and robust: name/company/title/bio contains, plus skill match
    where.AND = [{ OR: [
      { fullName: { contains: q.q, mode: 'insensitive' } },
      { company: { contains: q.q, mode: 'insensitive' } },
      { jobTitle: { contains: q.q, mode: 'insensitive' } },
      { bio: { contains: q.q, mode: 'insensitive' } },
      { skills: { has: q.q.toLowerCase() } },
    ] }];
  }

  const candidates = await prisma.user.findMany({ where, select: matchSelect, take: 300 });
  let ranked = rankPeople(asMatchProfile(viewer), candidates.map(asMatchProfile), q.mode === 'mentor')
    .map(({ candidate, match }) => ({ ...candidates.find((c) => c.id === candidate.id)!, match }));

  if (q.sort === 'helpful') ranked = ranked.sort((a, b) => b.points - a.points);
  if (q.sort === 'newest') ranked = ranked.sort((a, b) => +b.createdAt - +a.createdAt);

  return ranked.slice(0, q.limit).map(toPersonCard);
}

function toPersonCard(u: any) {
  return {
    id: u.id, handle: u.handle, fullName: u.fullName, avatarUrl: u.avatarUrl, role: u.role, currentYear: u.currentYear,
    department: u.department, batchYear: u.batchYear, company: u.company, jobTitle: u.jobTitle, isVerified: u.isVerified,
    skills: u.skills.slice(0, 4), canHelpWith: u.canHelpWith.slice(0, 3), mentorAvailable: u.mentorAvailable, mentorSlots: u.mentorSlots,
    match: u.match,
  };
}

export const suggestedPeople = (viewerId: string, limit = 3) =>
  discoverPeople(viewerId, { mode: 'all', sort: 'match', limit, skills: [], interests: [] } as any);
```

> `mode: 'insensitive'` works on PostgreSQL in Prisma. If you have many users later, replace the `contains` search with the full-text index from `TRD.md` §6.

3. `people.routes.ts`: `GET /people` (`validate({ query: peopleQuerySchema })`) and `GET /people/suggested`. Mount in `routes.ts`.

### Step 5 — Connection requests (10 min)

`src/services/notify.ts` — copy from `TRD.md` §10.2 (`Tx` = `Prisma.TransactionClient | PrismaClient`).

`connections.service.ts`:

```ts
export async function createRequest(requesterId: string, input: ConnectionCreateInput) {
  if (input.recipientId === requesterId) throw badRequest("You can't send a request to yourself");
  const recipient = await prisma.user.findUnique({ where: { id: input.recipientId }, select: { id: true, onboarded: true } });
  if (!recipient?.onboarded) throw notFound('That person is not available');
  const existing = await prisma.connection.findUnique({
    where: { requesterId_recipientId_kind: { requesterId, recipientId: input.recipientId, kind: input.kind } },
  });
  if (existing && existing.status !== 'DECLINED') throw conflict('You already sent this request');
  return prisma.$transaction(async (tx) => {
    const c = existing
      ? await tx.connection.update({ where: { id: existing.id }, data: { message: input.message, topic: input.topic, status: 'PENDING', respondedAt: null } })
      : await tx.connection.create({ data: { requesterId, ...input } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: requesterId }, select: { fullName: true } });
    const label = { CONNECT: 'connection', MENTORSHIP: 'mentorship', COLLAB: 'collaboration', PEER_GUIDANCE: 'peer guidance' }[input.kind];
    await notify(tx, { userId: input.recipientId, type: 'REQUEST', title: `${me.fullName} sent you a ${label} request`, body: input.topic ?? input.message.slice(0, 100), link: '/requests' });
    return c;
  });
}

export async function respond(userId: string, id: string, status: 'ACCEPTED' | 'DECLINED') {
  const c = await prisma.connection.findUnique({ where: { id } });
  if (!c || c.recipientId !== userId) throw notFound();
  if (c.status !== 'PENDING') throw conflict('This request was already answered');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.connection.update({ where: { id }, data: { status, respondedAt: new Date() } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, { userId: c.requesterId, type: 'REQUEST_RESPONSE', title: `${me.fullName} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your request`, link: '/requests' });
    // Phase 08 adds: if ACCEPTED → evaluateBadges for both users
    return updated;
  });
}

export async function listRequests(userId: string, box: 'incoming' | 'outgoing' | 'completed') {
  const where =
    box === 'incoming' ? { recipientId: userId, status: { in: ['PENDING', 'ACCEPTED'] as const } }
    : box === 'outgoing' ? { requesterId: userId, status: { in: ['PENDING', 'ACCEPTED', 'DECLINED'] as const } }
    : { OR: [{ requesterId: userId }, { recipientId: userId }], status: 'COMPLETED' as const };
  const rows = await prisma.connection.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: contactSelect }, recipient: { select: contactSelect } },
  });
  // Reveal visible contact links only once ACCEPTED/COMPLETED
  return rows.map((r) => ({ ...r, requester: maskContacts(r.requester, r.status), recipient: maskContacts(r.recipient, r.status) }));
}
```

`contactSelect` = `userLiteSelect` + `email`, `linkedinUrl`, `githubUrl`, `showEmail`, `showLinkedin`, `showGithub`. `maskContacts(u, status)` nulls each contact field unless `status` is ACCEPTED/COMPLETED **and** the matching `show*` flag is true, then removes the `show*` flags.

`complete(userId, id, note)` — only the **recipient** of a MENTORSHIP / PEER_GUIDANCE request that is ACCEPTED can mark it COMPLETED (sets `completedAt`, `sessionNote`, notifies the requester). Points and the Mentor badge are added in Phase 08.

`updateFollowUps(userId, id, followUps)` — either party, only when ACCEPTED or COMPLETED.

Routes: `POST /connections`, `GET /connections?box=…`, `PATCH /connections/:id`, `POST /connections/:id/complete`, `PUT /connections/:id/follow-ups`. All `requireOnboarded` + `validate`.

---

## 5. Step-by-step — Web

### Step 6 — People page (12 min)

**URL state:** every filter lives in the query string (`useSearchParams`) so results are shareable and the Back button works. `usePeople(params)` uses `qk.people(params)` and `placeholderData: keepPreviousData` (⚠️ check TanStack v5 import) so results don't flash while filters change.

**Layout (desktop):** `PageHeader` "Discover people" / "Find seniors, alumni and peers who can help — and people you can help." Right side of the header: a segmented control **All people | Find my alumni mentor**.

Below: two columns — filter panel (`w-72`, sticky) and results.

**Filter panel (`PeopleFilters`)** — sections separated by `Separator`:
- Search input (debounced 300 ms) "Name, company, skill…"
- Role: chips All · Students · Seniors · Alumni
- Department: `Select`
- Year (students) / Graduation year (alumni): `Select`
- Skills: `ChipPicker` (`SKILLS`)
- Interests: `ChipToggleGroup` (compact)
- Target role: `Select` from `TARGET_ROLES`
- Company: input with suggestions from seeded companies
- Switch: "Available as mentor"
- Footer: "Clear filters" link and active-filter count

On mobile the panel opens in a bottom `Sheet` from a "Filters (3)" button.

**Results header:** "24 people" · sort `Select` (Best match · Most helpful · Newest).

**Top matches strip:** when no filters are active, show "Top matches for you" — 3 larger cards in a row with a soft indigo gradient background, each with the match ring and 2 reasons.

**Mentor mode banner:** in "Find my alumni mentor" mode, show a slim info banner: "Showing alumni and seniors who are open to mentoring, ranked by your target companies, roles and skills." with a link "Update my targets" → `/settings/profile#goals`.

**PersonCard** (grid `sm:grid-cols-2 xl:grid-cols-3`, equal heights):
- Top row: `UserAvatar` (md), name (`font-semibold`) + `VerifiedBadge`, line 2: `RoleBadge` + "CSE-AI · 2nd year" or "ML Engineer @ Northwind Labs"; `MatchRing` on the right.
- Up to 2 `ReasonChip`s.
- Skills: 3 small neutral chips + "+2".
- "Can help with" line (primary colour text) when not empty.
- Mentor pill when `mentorAvailable`: "Mentor · Sat 5–6 pm".
- Footer: "View profile" (ghost) and **Connect** (primary, opens `ConnectDialog`).
- Whole card clickable to the profile except the buttons; hover lift.

**Empty state:** "No one matches these filters yet" + "Clear filters".
**Loading:** 6 `CardSkeleton`s.

### Step 7 — ConnectDialog (6 min)

Reusable everywhere (profile, people, post author, answer, opportunity, team owner).

Props: `recipient: UserLite`, `defaultKind?`, `defaultTopic?`, `defaultMessage?`, `trigger` (button) or controlled `open/onOpenChange`.

Content:
- Header: avatar + "Connect with {firstName}".
- Kind selector (radio cards with icons, 2×2): **Connect** ("Stay in touch"), **Mentorship** ("Ask for guidance on a specific question"), **Collaborate** ("Work on a project together"), **Peer guidance** ("Learn together with someone at your level").
- For Mentorship / Peer guidance: "What do you want help with?" input (required) with 3 clickable example prompts as small chips, e.g. "Which ML project should I build first as a first year?".
- Message textarea with a live counter (10–500) and placeholder tailored to the kind.
- If the recipient lists `mentorSlots`, show "Usually available: Sat 5–6 pm".
- Submit → toast "Request sent to {firstName}" → close → invalidate `qk.connections('outgoing')` and the profile query.
- 409 → toast "You already sent this request"; field errors map to inputs.

### Step 8 — Profile page (10 min)

`/u/:handle` → `useProfile(handle)`.

**Header card:** gradient banner (indigo → violet, `h-28`, rounded top), avatar `xl` overlapping the banner, name (`font-display text-2xl`), `VerifiedBadge`, `RoleBadge`, line: department · year/graduation year · company and role; contact icons (Mail, LinkedIn, GitHub) only when the server returned them; right side: `MatchRing` + top 3 reasons (for others) and **Connect** (or connection status: "Request pending" / "Connected" / "Mentorship completed"); for the owner: **Edit profile** button.

**Body (two columns on desktop):**
- Left (wide): About (bio) · Projects (cards with title, description, link icon) · Journey (`JourneyTimeline`: vertical timeline grouped by year with category icons and colours — Club users/indigo, Project code/violet, Internship briefcase/amber, Course book/sky, Achievement trophy/emerald, Job building/indigo, Startup rocket/rose) · Achievements (list with trophy icons).
- Right (narrow): Skills (chips) · Interests · "I can help with" (indigo chips) · "I'm looking for" (amber chips) · Target roles · Mentoring card (available? topics, slots, "Request a session" button) · Badges and Contributions placeholders (Phase 08).

**Empty sections:** for the owner show a dashed prompt ("Add your first project — it helps matching"); for others hide the section.

`/me` redirects to `/u/{me.handle}`.

### Step 9 — Profile edit page (8 min)

`/settings/profile` with `Tabs` (URL hash selects the tab): **Basics** (name, bio, department, graduation year, company/role for alumni) · **Skills & goals** (skills, interests, goal track cards, target roles, target companies) · **Connect & privacy** (help with, looking for, links, visibility switches) · **Projects & achievements** (`ProjectsEditor`: list with add/edit/remove rows using `useFieldArray`; achievements as a simple list) · **Journey** (`JourneyEditor`: add milestone form — year select, category select, title, description — plus the timeline with delete buttons; uses milestone endpoints) · **Mentoring** (available switch, topics `ChipPicker`, slots text, "Show me on the mentor wall" switch — only for seniors/alumni).

Each tab has its own **Save** button that sends only that tab's fields (the schema is `.partial()`), shows a spinner, then a toast "Profile updated". Invalidate `qk.me` and `qk.user(handle)`.

### Step 10 — Requests page (8 min)

`/requests` with tabs **Incoming** (badge with pending count), **Outgoing**, **Completed**.

`RequestRow`:
- Avatar, name, role badge, kind pill (Connect grey · Mentorship indigo · Collaborate violet · Peer guidance sky), relative time.
- The specific question (`topic`) in bold for mentorship/peer guidance; message below (2-line clamp, expandable).
- Status pill: Pending amber · Accepted emerald · Declined grey · Completed indigo.
- Incoming + Pending: **Accept** (primary) / **Decline** (ghost) with optimistic status change.
- Accepted: revealed contact links (only those the person made visible) + "Message on LinkedIn" style buttons opening in a new tab; for mentorship where you are the mentor: **Mark session completed** (dialog with optional session note).
- Accepted/Completed: `FollowUps` checklist — add item input, tick/untick, delete; saved with `PUT /connections/:id/follow-ups` (debounced 500 ms, optimistic).
- Empty states per tab: Incoming "No requests yet — complete your profile so people can find you"; Outgoing "Find someone to learn from" → `/people`.

Commit:

```bash
git add -A && git commit -m "phase-03: profiles, people, matching, requests" && git tag phase-03
```

---

## 6. UI quality checklist

- [ ] Person cards are equal height and aligned; match ring colours follow the bands (≥ 70 emerald, 40–69 indigo, < 40 grey).
- [ ] Reason chips never wrap awkwardly: max 2 on cards (truncate with tooltip), 3 on the profile.
- [ ] Filters update the URL; Back restores previous filters; the result count updates without layout jumps.
- [ ] Profile header looks great with and without a bio, company, links or projects.
- [ ] The journey timeline is the visual highlight of the profile: aligned dots, category colours, year labels.
- [ ] Every dialog closes on success and shows a toast; errors stay in the dialog.

---

## 7. Completion criteria

- [ ] 30 demo users exist with milestones; demo login works for `ananya`, `rahul`, `meera`, `karthik`, `admin`.
- [ ] Every person card shows a score and at least one reason (or "New to BridgeUp" when there is nothing to match).
- [ ] Filters combine with AND; free-text search finds names, companies, roles and skills.
- [ ] Mentor mode shows only seniors/alumni with mentoring on, and target-company matches rank highly with the reason "Works at {company}, your target company".
- [ ] Contact links obey visibility on the **API** response (check the Network tab).
- [ ] Requests: send, duplicate-blocked, accept/decline (recipient only), complete (mentor only), follow-ups — all work and notify.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 3.1 | Demo-login as Ananya → `/people` | "Top matches for you" shows 3 people; Rahul or Meera near the top with reasons like "Both interested in AI/ML" and "Can help with mentorship" |
| 3.2 | Switch to "Find my alumni mentor" | Only seniors/alumni with mentoring on; Meera shows "Works at {her company}, your target company" if Ananya targets it |
| 3.3 | Filter Role = Alumni + Skill = python | Only alumni with python |
| 3.4 | Search "computer vision" | Rahul appears (skill and project text); reason "Built projects in Computer Vision" or "Shared skills…" |
| 3.5 | Change filters, press Back twice | Previous filter states restored |
| 3.6 | As Rahul, turn off "Show LinkedIn"; as Ananya open his profile and check the Network response | `linkedinUrl: null`; no LinkedIn icon |
| 3.7 | Send a mentorship request without a question | Inline error "Add the specific question…" |
| 3.8 | Send a valid mentorship request | Toast; Outgoing shows Pending; Rahul's notifications table has a REQUEST row |
| 3.9 | Send the same request again | Toast "You already sent this request" |
| 3.10 | As Ananya, call `PATCH /api/connections/:id` with ACCEPTED (her own outgoing request) | 404 (not the recipient) |
| 3.11 | As Rahul accept → as Ananya open Outgoing | Accepted; Rahul's visible contacts appear |
| 3.12 | As Rahul mark the session completed with a note | Moves to Completed for both; Ananya notified |
| 3.13 | Add two follow-ups and tick one; reload | Follow-ups persist |
| 3.14 | Edit profile: add a project mentioning "nlp", save | Profile shows it; people who list NLP see a "Built projects in NLP" reason |
| 3.15 | Add and delete a journey milestone | Timeline updates; deleting someone else's id via the API returns 404 |
| 3.16 | Try `PATCH /api/me/profile` with `{"role":"ADMIN","points":999}` | Fields ignored (stripped by zod); role and points unchanged |
| 3.17 | Mobile 375px `/people` | Filters in a sheet; single-column cards; mentor toggle still visible |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Every score is 0 | Skills/interests stored with different casing — run `normalizeTag` in seeds and updates; re-seed |
| `hasSome` errors | The value must be an array of strings; empty arrays should skip the filter |
| Profile 404 for seeded users | `onboarded` must be true in the seed |
| Contacts visible when switched off | Check you return `toPublicProfile`/`maskContacts` output, not the raw Prisma row |

---

## 10. If you're behind

- Skip the "Top matches" strip and the "Most helpful/Newest" sorts.
- Skip `JourneyEditor` (seeded milestones still show on profiles and power Path Twins).
- Skip follow-ups (keep accept/decline/complete).
- Keep: matching with reasons, filters, mentor mode, requests with accept/decline, privacy on the server.
