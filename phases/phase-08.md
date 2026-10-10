# Phase 08 — Gamification, trust signals, success stories, moderation and admin

| | |
|---|---|
| **Time box** | 0:55 (cumulative 9:00) |
| **Goal** | Make contribution visible and rewarding without pressuring juniors (points, levels, badges, contributions, mentor wall, badge celebrations); show trust signals everywhere; publish success stories and spotlights; let anyone report content and let admins moderate and manage the platform |
| **Prerequisites** | Phase 07 complete. Points and badges are already being awarded by services since Phase 04 |
| **PRD features** | F34 Gamification, F35 Trust and contribution system, F36 Mentor wall, F37 Success stories and spotlights, F38 Reporting and moderation, F39 Admin tools |
| **Requirements** | FR-GAME-1…2, FR-TRUST-1, FR-STORY-1, FR-MOD-1…2, FR-ADMIN-1; your priority row "Reputation and badges", numbered features 6 and 12, later feature "Success stories & spotlights" |
| **Reference** | `PRD.md` §10 (gamification rules), `TRD.md` §10.1 (service), §8.8 (endpoints), §14 (security) |

---

## 1. What you will have at the end of this phase

- Level and points in the sidebar user card (seniors/alumni) and on the owner's own profile; never public for juniors.
- Profile **Badges** grid (earned + locked with "how to earn") and **Contributions** section ("Helped N students", counts, recent contributions).
- One-time **badge celebration** toast with a subtle sparkle animation.
- **Mentor wall** ("Thank you, mentors") on Community and Requests.
- Trust labels everywhere: Verified, Self-reported, Best answer, Helpful counts.
- **Success stories**: public `/stories` magazine grid and `/stories/:slug` article pages; spotlight on home and landing; Spotlight badge for featured people.
- **Report** button on posts, comments/answers, experiences, profiles, teams and stories.
- **Admin panel** `/admin` with tabs: Reports · Users · Events · Companies · Clubs · Stories · Experiences.

---

## 2. Concepts in this phase

- **Reward helping, never comparing.** Points come only from contributions that help others. Juniors' points are private; the only public list is an opt-in *thank-you* wall for seniors and alumni.
- **Trust is earned and labelled.** Verified status comes from admins; everything else says what it is ("Self-reported").
- **Soft deletes.** Moderation sets `isRemoved = true`, so content disappears everywhere (every query already filters it) but can be reviewed or restored.
- **Admin tools save the demo.** You can fix a typo in a company, add an event or verify a senior in seconds, without touching the database.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/modules/users/users.service.ts` | `getContributions(handle)` |
| `src/modules/gamification/gamification.routes.ts` | `GET /mentor-wall`, `GET /users/:handle/contributions` |
| `src/modules/stories/stories.service.ts`, `routes.ts` | Public list and detail |
| `src/modules/reports/reports.service.ts`, `routes.ts` | Create report |
| `src/modules/admin/admin.routes.ts` | All admin endpoints (behind `requireRole('ADMIN')`) |
| `src/modules/admin/*.service.ts` | `reports`, `users`, `events`, `companies`, `clubs`, `stories`, `experiences` |
| `src/modules/users/users.serializers.ts` | Include `badges` and `level` in profiles |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/moderation.ts` | `reportCreateSchema`, `reportResolveSchema`, `eventUpsertSchema`, `adminUserUpdateSchema`, `allowlistSchema`, `companyUpsertSchema`, `clubUpsertSchema` |
| `src/schemas/stories.ts` | `storyUpsertSchema` |
| `src/gamification.ts` | `levelFor` (copy of the API function so the web can compute progress) |

### Web

| File | Purpose |
|---|---|
| `src/components/gamification/PointsPill.tsx`, `LevelProgress.tsx`, `BadgeGrid.tsx`, `BadgeIcon.tsx`, `MentorWall.tsx`, `BadgeCelebration.tsx` | Gamification UI |
| `src/features/profile/Contributions.tsx` | Contributions section |
| `src/components/shared/ReportButton.tsx` | Report dialog |
| `src/features/stories/StoriesPage.tsx`, `StoryPage.tsx`, `StoryCard.tsx`, `api.ts` | Stories |
| `src/features/admin/AdminLayout.tsx` + tabs | Admin panel |
| `src/features/home/StorySpotlight.tsx`, `src/features/landing/LandingPage.tsx` | Spotlight |

---

## 4. Step-by-step — API

### Step 1 — Contributions and mentor wall (10 min)

```ts
export async function getContributions(handle: string) {
  const user = await prisma.user.findUnique({ where: { handle }, select: { id: true, role: true, points: true } });
  if (!user) throw notFound();
  const id = user.id;
  const [answers, bestAnswers, experiences, reviews, roadmaps, sessions, helpedRows, badges, recent] = await Promise.all([
    prisma.comment.count({ where: { authorId: id, parentId: null, isRemoved: false, post: { kind: 'QUESTION' } } }),
    prisma.post.count({ where: { bestAnswer: { authorId: id } } }),
    prisma.experience.count({ where: { authorId: id, isRemoved: false } }),
    prisma.clubReview.count({ where: { authorId: id } }),
    prisma.roadmap.count({ where: { authorId: id, isAi: false } }),
    prisma.connection.count({ where: { recipientId: id, kind: 'MENTORSHIP', status: 'COMPLETED' } }),
    // distinct people helped = askers of questions they answered + people they mentored
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(DISTINCT x.uid) AS n FROM (
        SELECT p."authorId" AS uid FROM "Comment" c JOIN "Post" p ON p.id = c."postId"
        WHERE c."authorId" = ${id} AND c."parentId" IS NULL AND p.kind = 'QUESTION' AND p."authorId" <> ${id}
        UNION
        SELECT "requesterId" FROM "Connection" WHERE "recipientId" = ${id} AND status IN ('ACCEPTED','COMPLETED')
      ) x`,
    prisma.userBadge.findMany({ where: { userId: id }, include: { badge: true }, orderBy: { awardedAt: 'asc' } }),
    prisma.pointsLedger.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);
  return {
    counts: { answers, bestAnswers, experiences, reviews, roadmaps, sessions },
    helped: Number(helpedRows[0]?.n ?? 0),
    badges: badges.map((b) => ({ ...b.badge, awardedAt: b.awardedAt })),
    recent, // used to render "Recent contributions" (action, points, date)
  };
}

export async function mentorWall() {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const rows = await prisma.pointsLedger.groupBy({
    by: ['userId'], where: { createdAt: { gte: start } }, _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } }, take: 30,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) }, role: { in: ['SENIOR', 'ALUMNI'] }, showOnMentorWall: true },
    select: { ...userLiteSelect, badges: { include: { badge: true }, take: 1, orderBy: { awardedAt: 'desc' } } },
  });
  return rows
    .map((r) => ({ user: users.find((u) => u.id === r.userId), pointsThisMonth: r._sum.points ?? 0 }))
    .filter((x) => x.user)
    .slice(0, 10);
}
```

Add `badges` (slug, name, icon) and `level` (from `levelFor(points)`, only when points are public) to `getPublicProfile`'s response.

Routes: `GET /users/:handle/contributions`, `GET /mentor-wall`.

### Step 2 — Reports (5 min)

`packages/shared/src/schemas/moderation.ts` (part):

```ts
export const reportCreateSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'EXPERIENCE', 'PROFILE', 'TEAM', 'STORY']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER']),
  details: z.string().trim().max(500).default(''),
});
export const reportResolveSchema = z.object({ action: z.enum(['REMOVE', 'DISMISS']) });
```

`createReport(userId, input)`: verify the target exists; prevent duplicate open reports from the same user on the same target (return the existing one); create. Notify all admins (`notifyMany`, type SYSTEM, "New report: {reason}", link `/admin/reports`). Rate-limit with `writeLimiter`.

Route: `POST /reports`.

### Step 3 — Stories (5 min)

`packages/shared/src/schemas/stories.ts`:

```ts
export const storyUpsertSchema = z.object({
  title: z.string().trim().min(8).max(140),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80).optional(), // generated from title if absent
  excerpt: z.string().trim().min(20).max(280),
  body: z.string().trim().min(100).max(20000),
  coverUrl: z.string().url().regex(/^https:\/\//).optional().or(z.literal('')),
  tags: z.array(z.string().trim().toLowerCase()).max(6).default([]),
  featuredUserId: z.string().uuid().optional().nullable(),
  isSpotlight: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});
```

Public service: `listStories({ tag, cursor })` → published, not removed, newest first, with featured user (lite); `getStory(slug)` → story + featured user + 3 related stories (shared tag). Routes are **public** (no auth) so the landing page can link to them: `GET /stories`, `GET /stories/:slug`.

### Step 4 — Admin endpoints (15 min)

All under `adminRouter` with `router.use(requireRole('ADMIN'))`:

| Endpoint | Behaviour |
|---|---|
| `GET /admin/reports?status=OPEN` | Reports with reporter (lite) and a **target preview** loaded per type: post title/excerpt + author, comment body + author, experience company/role, profile name/handle, team title, story title |
| `PATCH /admin/reports/:id` | `REMOVE` → set `isRemoved = true` on the target (for `PROFILE`: set `onboarded = false` and hide from people search — or add a `isSuspended` flag if you have time) + mark all open reports on that target `RESOLVED`; `DISMISS` → mark `DISMISSED`. Notify the reporter "Thanks — we reviewed your report" |
| `GET /admin/users?q=&role=` | Search users (name/email/handle) with role, verified, points, createdAt |
| `PATCH /admin/users/:id` | `{ isVerified?, role? }` (role cannot be set to ADMIN through the UI unless you're sure; never demote yourself) |
| `POST /admin/allowlist` | `{ email, role: 'ALUMNI' \| 'STUDENT' }` → invite alumni with personal emails |
| `GET/POST/PATCH/DELETE /admin/events[/:id]` | This Week events (title, description, category, startsAt, endsAt, link, location, audienceYears) |
| `GET/POST/PATCH /admin/companies[/:id]` | Company fields incl. rounds and prep roadmap JSON (validated with zod) |
| `GET/POST/PATCH /admin/clubs[/:id]` | Club fields |
| `GET/POST/PATCH /admin/stories[/:id]` | Story fields; on publish set `publishedAt`; if `featuredUserId` → `grantBadge(featuredUserId, 'spotlight')` + notify "You're featured in a success story!"; only one spotlight at a time (unset others when `isSpotlight` is true) |
| `PATCH /admin/experiences/:id` | `{ isVerified }` |

`eventUpsertSchema`:

```ts
export const eventUpsertSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(['DEADLINE', 'CLUB', 'EXAM', 'HACKATHON', 'PLACEMENT', 'EVENT', 'REUNION', 'CHAPTER_MEET', 'WEBINAR']),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  link: z.string().url().regex(/^https?:\/\//).optional().or(z.literal('')),
  location: z.string().trim().max(120).optional(),
  audienceYears: z.array(z.number().int().min(1).max(5)).min(1).default([1, 2, 3, 4, 5]),
});
```

Mount `adminRouter` at `/admin` in `routes.ts`.

---

## 5. Step-by-step — Web

### Step 5 — Gamification UI (12 min)

**`levelFor`** in `packages/shared/src/gamification.ts` (same as the API version) so the client can show progress.

**`PointsPill`**: amber-tinted pill with a star icon and the number (`tabular`), e.g. "★ 145".

**`LevelProgress`**: level name (e.g. "Guide") + "145 / 400 to Mentor" + a thin progress bar in amber; at max level "Legend — thank you for everything you do".

**Sidebar user card**: for SENIOR/ALUMNI: avatar, name, `PointsPill`, level name, mini progress bar. For students: avatar, name, role badge only.

**Profile additions (`ProfilePage`)**:
- Right column **Badges** card: `BadgeGrid` — 3-column grid of 9 badges; earned: icon in a coloured circle (amber/indigo/emerald variations), name, tooltip "Earned on 12 Oct"; locked: grey circle with a lock overlay, tooltip "How to earn: Answer any question". Shown to everyone for seniors/alumni; for students, shown only to the owner (badges are encouraging for them, but not public).
- **Contributions** card (`Contributions`): headline "Helped 12 students" with a heart icon; a 2×3 stat grid (Answers, Best answers, Experiences, Club reviews, Roadmaps, Mentor sessions); "Recent contributions" list from `recent` (e.g. "+15 Best answer · 2 days ago"). Same visibility rule as badges.
- Owner view adds `LevelProgress` at the top of the Contributions card.

**`BadgeCelebration`** (mounted once in `AppShell`):
- On mount and whenever `qk.unread` changes, fetch unread notifications of type BADGE (add `?type=BADGE&unread=true` support to `GET /notifications` or filter client-side from the latest 20).
- For each, show a `toast` with a custom body: badge icon in an amber circle, "Badge unlocked: Trusted Voice", description; plus a light sparkle burst (CSS keyframes on 8 small dots radiating from the toast icon, 600 ms) — **skip the animation when `prefers-reduced-motion`**.
- Mark those notifications read so the celebration happens only once.

**`MentorWall`**: card titled "Thank you, mentors 💛" (a single emoji is fine here), subtitle "Seniors and alumni who helped the most this month"; up to 10 rows: avatar, name, role, top badge icon, "+120 this month"; no ranks, no numbers like "#1" (gratitude, not competition); footer "Want to be here? Answer a question" → `/ask?tab=unanswered`. Place it in the Community right rail and at the top of `/requests` for seniors/alumni.

### Step 6 — Trust signals sweep (5 min)

Make sure these appear consistently:

| Where | Signal |
|---|---|
| Any author line (posts, answers, comments, experiences, roadmaps, teams, people cards) | `RoleBadge` + `VerifiedBadge` when `isVerified` |
| Experience cards | `SelfReportedBadge` unless `isVerified` → "Verified" emerald pill |
| Answers | "Best answer" label; Helpful count |
| Profiles of seniors/alumni | Level + badges + "Helped N students" |
| Mentor cards | "Mentored N students" (completed sessions) when > 0 |

Each badge has a tooltip explaining what it means.

### Step 7 — Report button (5 min)

`ReportButton` (`targetType`, `targetId`, `variant: 'menu-item' | 'icon'`): opens a dialog "Report this {post}" with radio options (Spam · Misleading · Inappropriate · Harassment · Something else) and an optional details textarea; submit → toast "Thanks — a moderator will review this."; already reported → "You've already reported this".

Add it to: `PostCard` and detail overflow menus, `AnswerCard`, comments, `ExperienceCard`, profile header overflow menu (not on your own profile), `TeamCard`/team page, story page.

### Step 8 — Success stories (8 min)

**`/stories`** (public; works signed out with a minimal header if not signed in, or inside the app shell if signed in):
- Header: "Success stories" / "Journeys from our campus — to inspire your own."
- **Featured** story as a large hero card (cover image or a gradient fallback, title, excerpt, featured person avatar + "Now at …", "Read story").
- Magazine grid of `StoryCard`s (`md:grid-cols-2 lg:grid-cols-3`): cover (16:9, `object-cover`, rounded top), tags, title, excerpt (3 lines), featured person, read time ("4 min read" from word count / 200).
- Tag filter chips.

**`/stories/:slug`**: article layout `max-w-2xl`: cover, tags, title (`font-display text-4xl`), featured person card (avatar, name, role, company, Connect button if signed in), published date, read time, body (`PlainText` with comfortable reading typography: 17px, 1.75 line-height, paragraphs spaced), "More stories" (3 related), Bookmark and Report (signed in).

**Spotlight**: `StorySpotlight` on home (Phase 05 rail slot) and a "Stories from our campus" section on the landing page with the spotlight story and 2 latest.

### Step 9 — Admin panel (15 min)

**`/admin`** (inside `RequireAdmin`), `AdminLayout`: page header "Admin" with a warning-coloured "Admin" badge; vertical tabs on desktop / horizontal scroll on mobile: **Reports (count) · Users · Events · Companies · Clubs · Stories · Experiences**.

| Tab | UI |
|---|---|
| Reports | Status filter (Open · Resolved · Dismissed); table/cards: target type pill, preview (title/body excerpt + author), reason pill, details, reporter, time; actions **Remove content** (destructive, confirm dialog) and **Dismiss**; link "Open" to view the content in context |
| Users | Search input; table: avatar+name+handle, email, role, year, verified switch (optimistic), points, joined; "Invite alumni" button → dialog (email, role) |
| Events | List of upcoming and past events; "Add event" dialog (title, category select, date-time inputs, link, location, audience years checkboxes 1–5); edit and delete |
| Companies | List; edit dialog with fields + rounds editor (name, type, description rows) + skills tested `ChipPicker` + prep roadmap rows (title, detail, category) |
| Clubs | List; edit dialog (name, category, description, time commitment, skills gained, recruitment month, join URL) |
| Stories | List with status pills (Draft/Published) and spotlight star; editor page/dialog: title, slug (auto), excerpt, cover URL (with preview), tags, featured person (searchable select of users), body textarea (large), spotlight switch, Save draft / Publish |
| Experiences | Latest experiences with company/role/author; **Verify** toggle |

Use shadcn `Table` on desktop and stacked cards on mobile. Every mutation shows a toast and invalidates the relevant admin query and any public query it affects (e.g. events → `qk.rail`).

Show the **Admin** nav item only to admins (`FOOTER_NAV` `adminOnly`).

Commit:

```bash
git add -A && git commit -m "phase-08: gamification ui, trust, stories, moderation, admin" && git tag phase-08
```

---

## 6. UI quality checklist

- [ ] Gamification feels warm and grateful ("You've helped 12 students"), never competitive; no ranks or "#1".
- [ ] Badge art is consistent: same icon size, coloured circles, clear locked state.
- [ ] Celebration is subtle, happens once, and respects reduced motion.
- [ ] Report dialog is quick (two clicks) and reassuring.
- [ ] Stories pages look like a real magazine: good typography, cover images with gradient fallbacks, comfortable reading width.
- [ ] Admin panel is clean and functional (tables, confirm dialogs for destructive actions), not a raw dump.

---

## 7. Completion criteria

- [ ] Points shown match `User.points` and the sum of `PointsLedger.points`.
- [ ] Juniors' points, levels and badges are never visible to other users (check API responses, not just the UI).
- [ ] All 9 badges can be earned by their documented actions (Spotlight via a published story).
- [ ] Mentor wall lists only opted-in seniors/alumni with points this month.
- [ ] Report → remove → content hidden for all users and from search; dismiss leaves it visible.
- [ ] Non-admins get redirected from `/admin` and receive 403 from `/api/admin/*`.
- [ ] Stories are public, spotlight appears on home and landing.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 8.1 | As Rahul compare the sidebar points with `select sum(points) from "PointsLedger" where "userId"='…'` | Equal |
| 8.2 | As Ananya view Rahul's profile | Level, badges, contributions, "Helped N students" visible |
| 8.3 | As Rahul view Ananya's profile; inspect the API response | No points/level/badges for her (`points: null`) |
| 8.4 | Make a new demo senior answer their first question; reload twice | "First Answer" celebration once only |
| 8.5 | Turn off "Show me on the mentor wall" as Rahul | He disappears from the wall |
| 8.6 | As Ananya report a post as spam | Toast; admins get a notification; report appears in Admin → Reports |
| 8.7 | As admin remove it | Post disappears from feed, community, search and its URL shows "not found" |
| 8.8 | As admin dismiss a different report | Content stays; report marked Dismissed |
| 8.9 | As admin verify a senior | Verified check appears on their cards and answers |
| 8.10 | As admin add a This Week event for tomorrow (years 1–2) | Appears on Ananya's home This Week |
| 8.11 | As admin publish a story featuring Meera with spotlight on | `/stories` shows it featured; home and landing show the spotlight; Meera gets the Spotlight badge |
| 8.12 | As Ananya open `/admin` and call `GET /api/admin/reports` | Redirect to `/home`; API returns 403 |
| 8.13 | Signed out, open `/stories/:slug` | Story readable; no Connect/Bookmark buttons |
| 8.14 | Mobile 375px stories and admin | Readable article; admin tables become cards |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `groupBy` ordering error | Check the Prisma `groupBy` `orderBy` syntax for your version; or sort in memory |
| Celebration repeats | Mark the BADGE notifications read right after showing them |
| Removed comments still counted | `commentCount` isn't decremented by moderation — acceptable for the demo; or decrement in the REMOVE action for comments |
| Story body loses paragraphs | Render with `PlainText` (splits on blank lines) |

---

## 10. If you're behind

- Skip the Companies, Clubs and Experiences admin tabs (edit via Prisma Studio).
- Skip the mentor wall and the celebration animation (keep the toast).
- Skip story tag filters and related stories.
- Keep: profile badges and contributions, junior privacy, report button, reports queue with remove/dismiss, events admin, stories with spotlight.
