# Phase 07 — Opportunities, alerts, Team Finder, founder track, study circles, mentorship sessions and notifications

| | |
|---|---|
| **Time box** | 1:05 (cumulative 8:05) |
| **Goal** | Students discover and share opportunities with personalised alerts, form cross-department teams, find co-founders and alumni advisors, join study circles, run short mentorship sessions with follow-ups, and see everything that happens in a notification bell |
| **Prerequisites** | Phase 06 complete |
| **PRD features** | F26 Opportunities, F27 Opportunity alerts, F28 Team Finder, F29 Cross-department collaboration, F30 Founder track, F31 Study circles, F32 Mentorship sessions, F33 Notifications |
| **Requirements** | FR-OPP-1…3, FR-ALERT-1, FR-TEAM-1…4, FR-MENT-1…2, FR-NOTIF-1; your Module D, Opportunities Board, numbered features 3, 5, 8, 10, 11; placement feature 4 (sessions and follow-ups) |
| **Reference** | `TRD.md` §10.2 (notifications and alert matching), §8.7 (endpoints) |


> **Codebase conventions (verified build).** The repository is the source of truth; when this guide and the code differ, follow the code.
> - Import Prisma types from the generated client: `import type { Prisma } from '../../generated/prisma/client'` (not `@prisma/client`).
> - Paginated lists return `{ data: { items, nextCursor } }`; use `LIMITS.PAGE_SIZE` from `src/config/constants.ts`, never a literal.
> - No hardcoded settings: deployment values go in `src/config/env.ts` (+ `.env.example`); tuning numbers in `src/config/constants.ts`; topic ids come from `GET /topics` (never `index + 1`).
> - Routes declare `requireAuth` / `requireOnboarded` / `requireRole('ADMIN')` and `validate({ body, query })` with schemas from `@bridgeup/shared`; read input from `req.valid`.
> - Every new endpoint gets a row in `apps/api/src/docs/openapi.ts` (Swagger at `/api/docs`) and, where useful, a check in `apps/api/scripts/smoke.ts`.
> - Transactions that award points, evaluate badges and notify run inside `prisma.$transaction` (timeout configured in `src/lib/prisma.ts`).
> - Before committing: `npm run typecheck && npm test && npm run build`, then `npm run smoke` against a running API.

---

## 1. What you will have at the end of this phase

- `/opportunities` (type filters, Closing soon / Newest, past toggle, reasons) and `/opportunities/new`.
- Alert preferences (`/me/alerts`) and alert notifications on new matching opportunities.
- `/teams` with tabs Hackathon · Project · Founder track · Study circles, "Matches my skills" and "Role needed" filters; `/teams/new`; `/teams/:id` with apply/accept/reject, open-join study circles, members and close.
- Mentorship sessions: availability on profiles, "Available as mentor" filter (already in Phase 03), mark completed with points and badge, follow-up actions.
- Notification bell with unread count (polling), popover and `/notifications` page.

---

## 2. Concepts in this phase

- **Opportunities are posts** (`kind = OPPORTUNITY`), as your notes suggest for the MVP: one system for creation, voting, comments, bookmarks, search and reporting.
- **Alerts are preferences, not subscriptions to a person.** When an opportunity is created, the server finds users whose preferences match and creates notifications in the same transaction. No email or push in this version.
- **Teams cover four needs with one model:** hackathon teams, projects, startups (founder track) and study circles. `kind` drives the UI; `openJoin` makes study circles instant.
- **Polling is enough.** The bell refetches the unread count every 30 seconds; real-time sockets are a later upgrade.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/modules/opportunities/opportunities.service.ts`, `routes.ts` | List with filters and reasons |
| `src/modules/posts/posts.service.ts` | Call `notifyOpportunityAlerts` when an opportunity is created |
| `src/services/alerts.ts` | `notifyOpportunityAlerts(tx, post)` |
| `src/modules/alerts/alerts.routes.ts` | `GET/PUT /me/alerts` |
| `src/modules/teams/teams.service.ts`, `teams.routes.ts` | Teams CRUD-lite, apply, respond, join, close |
| `src/modules/connections/connections.service.ts` | `complete` awards points and the Mentor badge |
| `src/modules/notifications/notifications.service.ts`, `routes.ts` | List, unread count, mark read |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/alerts.ts` | `alertPrefsSchema` |
| `src/schemas/teams.ts` | `teamCreateSchema`, `teamApplySchema`, `applicationRespondSchema`, `teamListQuerySchema` |
| `src/schemas/opportunities.ts` | `opportunityListQuerySchema` |

### Web

| File | Purpose |
|---|---|
| `src/features/opportunities/*` | `OpportunitiesPage`, `OpportunityNewPage`, `OpportunityCard`, `DeadlineBadge`, `AlertSettingsDialog`, `api.ts` |
| `src/features/teams/*` | `TeamsPage`, `TeamPage`, `TeamNewPage`, `TeamCard`, `ApplyDialog`, `ApplicantsList`, `AdvisorsCard`, `MembersList`, `api.ts` |
| `src/components/layout/NotificationBell.tsx` | Bell + popover |
| `src/features/notifications/NotificationsPage.tsx`, `api.ts` | Full list |
| `src/features/requests/RequestRow.tsx` | Points toast on completion |

---

## 4. Step-by-step — API

### Step 1 — Opportunity list and alerts (12 min)

`packages/shared/src/schemas/opportunities.ts`:

```ts
export const opportunityListQuerySchema = z.object({
  type: z.enum(['INTERNSHIP', 'HACKATHON', 'RESEARCH', 'EVENT', 'REFERRAL', 'STUDY_GROUP', 'COLLABORATION', 'CAREER_GUIDANCE']).optional(),
  sort: z.enum(['closing', 'newest']).default('closing'),
  showPast: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  cursor: z.string().optional(),
});
```

`opportunities.service.ts`:

```ts
export async function listOpportunities(viewerId: string, q: OppQuery) {
  const viewer = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { interests: true, skills: true, alertSubscription: true } });
  const now = new Date();
  const where: Prisma.PostWhereInput = {
    kind: 'OPPORTUNITY', isRemoved: false,
    ...(q.type ? { opportunityType: q.type } : {}),
    ...(q.showPast ? {} : { OR: [{ deadline: null }, { deadline: { gte: now } }] }),
  };
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    q.sort === 'closing' ? [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];
  const skip = Math.max(0, Number(q.cursor) || 0);
  const rows = await prisma.post.findMany({ where, orderBy, skip, take: LIMITS.PAGE_SIZE + 1, include: postInclude });
  const items = rows.slice(0, LIMITS.PAGE_SIZE);
  const state = await viewerStateFor(viewerId, items);
  const mine = new Set([...viewer.interests, ...viewer.skills]);
  return {
    items: items.map((p) => {
      const hit = p.tags.find((t) => mine.has(t));
      const typeHit = viewer.alertSubscription?.opportunityTypes.includes(p.opportunityType!);
      return { ...toPostCard(p, state), reason: hit ? `Matches your interest: ${titleCase(hit)}` : typeHit ? 'Matches your alerts' : null };
    }),
    nextCursor: rows.length > LIMITS.PAGE_SIZE ? String(skip + LIMITS.PAGE_SIZE) : null,
  };
}
```

> ⚠️ `{ sort: 'asc', nulls: 'last' }` in `orderBy` is supported by recent Prisma versions for PostgreSQL; check your version. If unsupported, sort in memory.

`src/services/alerts.ts`:

```ts
export async function notifyOpportunityAlerts(tx: Tx, post: { id: string; authorId: string; title: string; topicId: number | null; tags: string[]; opportunityType: OpportunityType | null }) {
  const or: Prisma.AlertSubscriptionWhereInput[] = [];
  if (post.opportunityType) or.push({ opportunityTypes: { has: post.opportunityType } });
  if (post.topicId) or.push({ topicIds: { has: post.topicId } });
  if (post.tags.length) or.push({ tags: { hasSome: post.tags } });
  if (!or.length) return 0;
  const subs = await tx.alertSubscription.findMany({ where: { enabled: true, userId: { not: post.authorId }, OR: or }, select: { userId: true }, take: LIMITS.ALERT_NOTIFY_MAX });
  const label = post.opportunityType ? post.opportunityType.replace(/_/g, ' ').toLowerCase() : 'opportunity';
  await notifyMany(tx, subs.map((s) => s.userId), {
    type: 'OPPORTUNITY', title: `New ${label}: ${post.title.slice(0, 70)}`, body: 'Matches your alert preferences', link: `/post/${post.id}`,
  });
  return subs.length;
}
```

Call it inside `createPost`'s transaction when `kind === 'OPPORTUNITY'` (replace the Phase 04 TODO). Return `{ id, alerted }` so the UI can say "12 students with matching alerts were notified".

`packages/shared/src/schemas/alerts.ts`:

```ts
export const alertPrefsSchema = z.object({
  enabled: z.boolean(),
  opportunityTypes: z.array(z.enum(['INTERNSHIP', 'HACKATHON', 'RESEARCH', 'EVENT', 'REFERRAL', 'STUDY_GROUP', 'COLLABORATION', 'CAREER_GUIDANCE'])).max(8),
  topicIds: z.array(z.number().int()).max(6),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10),
});
```

Routes: `GET /opportunities`, `GET /me/alerts` (create default row if missing), `PUT /me/alerts` (upsert).

### Step 2 — Teams, founder track and study circles (15 min)

`packages/shared/src/schemas/teams.ts`:

```ts
export const teamCreateSchema = z.object({
  kind: z.enum(['HACKATHON', 'PROJECT', 'STARTUP', 'STUDY_CIRCLE']),
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20, 'Describe the idea or goal (20+ characters)').max(2000),
  requiredSkills: z.array(z.string().trim().toLowerCase()).max(10).default([]),
  rolesNeeded: z.array(z.string().trim().toLowerCase()).max(8).default([]),
  commitment: z.string().trim().max(80).default(''),        // "6 h/week for 4 weeks"
  maxMembers: z.number().int().min(2).max(20).default(4),
  meetingDetails: z.string().trim().max(300).default(''),   // where/how they meet (no video calls in-app)
  schedule: z.string().trim().max(120).default(''),         // "Tue & Thu 7–8 pm"
  openJoin: z.boolean().default(false),
});
export const teamApplySchema = z.object({ message: z.string().trim().min(10).max(500) });
export const applicationRespondSchema = z.object({ status: z.enum(['ACCEPTED', 'REJECTED']) });
export const teamListQuerySchema = z.object({
  kind: z.enum(['HACKATHON', 'PROJECT', 'STARTUP', 'STUDY_CIRCLE']).optional(),
  matchesMe: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  role: z.string().optional(),
  includeClosed: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});
```

`teams.service.ts`:

```ts
export async function listTeams(viewerId: string, q: TeamListQuery) {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { skills: true } });
  const teams = await prisma.team.findMany({
    where: {
      isRemoved: false,
      ...(q.includeClosed ? {} : { status: 'OPEN' }),
      ...(q.kind ? { kind: q.kind } : {}),
      ...(q.matchesMe && me.skills.length ? { requiredSkills: { hasSome: me.skills } } : {}),
      ...(q.role ? { rolesNeeded: { has: q.role.toLowerCase() } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: userLiteSelect },
      applications: { where: { status: 'ACCEPTED' }, select: { applicant: { select: userLiteSelect } } },
      _count: { select: { applications: { where: { status: 'PENDING' } } } },
    },
  });
  return teams.map((t) => ({
    ...t,
    members: [t.owner, ...t.applications.map((a) => a.applicant)],
    memberCount: 1 + t.applications.length,
    pendingCount: t.ownerId === viewerId ? t._count.applications : undefined,
    skillMatch: t.requiredSkills.filter((s) => me.skills.includes(s)),
  }));
}

export async function applyToTeam(userId: string, teamId: string, message: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, isRemoved: false }, include: { _count: { select: { applications: { where: { status: 'ACCEPTED' } } } } } });
  if (!team) throw notFound();
  if (team.ownerId === userId) throw badRequest('You own this team');
  if (team.status === 'CLOSED') throw conflict('This listing is closed');
  if (1 + team._count.applications >= team.maxMembers) throw conflict('This team is full');
  const existing = await prisma.teamApplication.findUnique({ where: { teamId_applicantId: { teamId, applicantId: userId } } });
  if (existing) throw conflict('You already applied');
  return prisma.$transaction(async (tx) => {
    const status = team.openJoin ? 'ACCEPTED' : 'PENDING';
    const app = await tx.teamApplication.create({ data: { teamId, applicantId: userId, message, status } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, {
      userId: team.ownerId, type: 'APPLICATION',
      title: team.openJoin ? `${me.fullName} joined ${team.title}` : `${me.fullName} wants to join ${team.title}`,
      body: message.slice(0, 100), link: `/teams/${teamId}`,
    });
    return app;
  });
}

export async function respondApplication(ownerId: string, teamId: string, appId: string, status: 'ACCEPTED' | 'REJECTED') {
  const app = await prisma.teamApplication.findFirst({ where: { id: appId, teamId }, include: { team: true } });
  if (!app || app.team.ownerId !== ownerId) throw notFound();
  if (app.status !== 'PENDING') throw conflict('Already answered');
  return prisma.$transaction(async (tx) => {
    // Re-check capacity inside the transaction so two quick accepts can't overfill the team
    if (status === 'ACCEPTED') {
      const members = 1 + (await tx.teamApplication.count({ where: { teamId, status: 'ACCEPTED' } }));
      if (members >= app.team.maxMembers) throw conflict('This team is full');
    }
    const updated = await tx.teamApplication.update({ where: { id: appId }, data: { status } });
    await notify(tx, { userId: app.applicantId, type: 'APPLICATION',
      title: status === 'ACCEPTED' ? `You're in! ${app.team.title} accepted you` : `Update on ${app.team.title}`,
      body: status === 'ACCEPTED' ? 'Say hi to your new team' : 'The team went with someone else this time — keep going!',
      link: `/teams/${teamId}` });
    return updated;
  });
}
```

`getTeam(viewerId, id)` returns the team, owner, accepted members, the viewer's own application (if any) and — **only for the owner** — all applications with each applicant's skill overlap with `requiredSkills`. `closeTeam(ownerId, id)` sets `status = CLOSED`.

**Founder track advisors:** `GET /teams/advisors` → alumni (and seniors) with `canHelpWith has 'startups'` or a STARTUP milestone, ranked with `rankPeople` against the viewer (limit 6).

Routes: `GET /teams`, `GET /teams/advisors`, `POST /teams`, `GET /teams/:id`, `POST /teams/:id/apply`, `PATCH /teams/:id/applications/:appId`, `PATCH /teams/:id` (close).

### Step 3 — Mentorship sessions (5 min)

`connections.service.complete` already awards `MENTOR_SESSION` points and evaluates badges (added in Phase 04), and `respond()` already evaluates badges on ACCEPTED. Change it to also **return** `pointsEarned` so the UI can show the toast:

```ts
export async function complete(userId: string, id: string, sessionNote?: string) {
  const c = await prisma.connection.findUnique({ where: { id } });
  if (!c || c.recipientId !== userId) throw notFound();
  if (!['MENTORSHIP', 'PEER_GUIDANCE'].includes(c.kind)) throw badRequest('Only mentorship sessions can be completed');
  if (c.status !== 'ACCEPTED') throw conflict('Accept the request first');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.connection.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date(), sessionNote } });
    let pointsEarned = 0;
    if (c.kind === 'MENTORSHIP' && (await awardPoints(tx, userId, 'MENTOR_SESSION', POINTS.MENTOR_SESSION, id))) pointsEarned = POINTS.MENTOR_SESSION;
    await evaluateBadges(tx, userId);
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, { userId: c.requesterId, type: 'REQUEST_RESPONSE', title: `Session with ${me.fullName} marked complete`, body: 'Add follow-up actions so nothing gets lost', link: '/requests?tab=completed' });
    return { connection: updated, pointsEarned };
  });
}
```

Also call `evaluateBadges` for both people in `respond()` when a request is ACCEPTED (Bridge Builder).

### Step 4 — Notifications (8 min)

```ts
export async function listNotifications(userId: string, q: { cursor?: string; type?: string; unread?: boolean }) {
  const cur = decodeCursor(q.cursor);
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(q.type ? { type: q.type } : {}),
      ...(q.unread ? { isRead: false } : {}),
      ...(cur ? { OR: [{ createdAt: { lt: cur.createdAt } }, { createdAt: cur.createdAt, id: { lt: cur.id } }] } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: LIMITS.PAGE_SIZE + 1,
  });
  const items = rows.slice(0, LIMITS.PAGE_SIZE);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > LIMITS.PAGE_SIZE && last ? encodeCursor(last.createdAt, last.id) : null };
}
export const unreadCount = (userId: string) => prisma.notification.count({ where: { userId, isRead: false } });
export const markRead = (userId: string, body: { ids?: string[]; all?: boolean }) =>
  prisma.notification.updateMany({ where: { userId, isRead: false, ...(body.all ? {} : { id: { in: body.ids ?? [] } }) }, data: { isRead: true } });
```

Schemas in `packages/shared/src/schemas/notifications.ts`: `notificationListQuerySchema` (`cursor?`, `type?`, `unread?`) and `markReadSchema` (`{ ids?: uuid[] (max 100), all?: boolean }`, refine: one of the two). Add `ALERT_NOTIFY_MAX: 500` to `LIMITS`.

Routes: `GET /notifications?cursor=&type=&unread=`, `GET /notifications/unread-count`, `POST /notifications/read` (all `requireAuth`, validated). Declare `/teams/advisors` **before** `/teams/:id`.

---

## 5. Step-by-step — Web

### Step 5 — Opportunities (12 min)

**`/opportunities`**
- `PageHeader` "Opportunities" / "Internships, hackathons, research, referrals and more — shared by your campus." Actions: **Share an opportunity** (primary), **Alert settings** (bell icon button, opens `AlertSettingsDialog`; also opened when `?alerts=1`).
- Type tabs with icons from `OPPORTUNITY_TYPES` (All + 8), scrollable on mobile.
- Sort segmented: **Closing soon · Newest**; switch **Show past**.
- `OpportunityCard`:
  - Left: type icon in a coloured rounded square (internship indigo, hackathon violet, research teal, event sky, referral emerald, study group amber, collaboration pink, career guidance slate).
  - Title, organisation · posted by (avatar + name + role), `RelativeTime`.
  - `DeadlineBadge`: "Closes in 3 days" amber (≤ 7 days), rose (≤ 2 days: "Closes tomorrow"/"Closes today"), grey ("Closes Oct 30"), muted strike ("Closed").
  - Reason chip when present; tags.
  - Footer: **Apply / Learn more** (external link if safe URL, opens new tab), **Connect with poster** (Connect dialog, kind CONNECT, message prefilled "Hi! I saw your post about '{title}' — could you tell me more?"), Bookmark, comments count (links to `/post/:id`), Report.
- Empty state: "No open opportunities here yet — share one you know about."

**`/opportunities/new`** (or a dialog): title, type (radio cards with icons), organisation, description, deadline (date input), external link, topic (optional), tags. Helper text under the type: "Students whose alerts match this type, topic or tags will be notified." Submit → toast "Shared! 12 students with matching alerts were notified." → `/post/:id`.

**`AlertSettingsDialog`**: master switch "Opportunity alerts"; "Types" toggle chips (8 types); "Topics" toggle chips (6 topics); "Keywords" `ChipPicker` (e.g. "sde", "ml internship", "quant"); note "Alerts appear in your notifications. No emails." Save → toast.

### Step 6 — Teams (15 min)

**`/teams`**
- `PageHeader` "Teams" / "Find teammates across departments — for hackathons, projects, startups and study circles." Action **Create a listing**.
- Tabs: **Hackathons · Projects · Founder track · Study circles · All**.
- Filters row: switch **Matches my skills**, `Select` **Role needed** (from `TEAM_ROLES`: designer, business / pitch, ml engineer, frontend… — cross-department), switch **Show closed**.
- `TeamCard`: kind badge (Founder track = rocket icon in warm amber), title, idea (3-line clamp), required skills chips with ✓ for the viewer's skills (emerald) and plain for others, "Looking for: Designer · Business / pitch" (roles needed, highlighted), commitment and schedule with clock icon, member avatars stack + "3/5 members", owner, footer **View** / **Apply** (or **Join** for open study circles).
- **Founder track tab**: a banner card "Building a startup? Find co-founders — and alumni founders who can advise you." + `AdvisorsCard` (alumni advisors from `/teams/advisors`: avatar, name, "Founded X" or role, reasons, Connect with kind MENTORSHIP topic "Advice on my startup idea").
- **Study circles tab**: cards emphasise goal, schedule and meeting details ("Library room 2, Tue & Thu 7 pm"); "Join instantly" when `openJoin`.

**`/teams/new`**: kind picker (4 cards; kind can be preselected from the active tab), title, description (placeholder adapts: hackathon "What are you building and for which hackathon?", startup "The problem, your idea, and what stage you're at", study circle "Goal, e.g. finish Striver's sheet together in 8 weeks"), required skills `ChipPicker`, roles needed `ChipToggleGroup` (TEAM_ROLES), commitment, max members (stepper), schedule, meeting details, open join switch (study circles only). Submit → `/teams/:id`.

**`/teams/:id`**:
- Header: kind badge, title, status (Open emerald / Closed grey), owner with Connect, created time.
- Body: idea/goal, required skills (✓ for the viewer), roles needed, commitment, schedule, meeting details, `MembersList`.
- Viewer actions: **Apply** → `ApplyDialog` (message 10–500 with prompt "Why you'd be a great fit — mention your skills", shows which required skills you have) → toast "Application sent"; status pill after applying (Pending / Accepted / Rejected); open-join: **Join** → instant member.
- Owner view: `ApplicantsList` tab with pending count: applicant card (avatar, name, role, department — highlight different departments as "Cross-department" chip, skill overlap chips, message) with **Accept / Reject**; **Close listing** button with confirm dialog.
- Report in the overflow menu (Phase 08).

### Step 7 — Mentorship sessions UI (3 min)

- In `/requests` (Phase 03): after **Mark session completed**, show the toast "+25 helpfulness — thank you for mentoring!" when `pointsEarned > 0`.
- Requesters see a prompt on completed sessions: "Add follow-up actions" (focus the follow-ups input).
- Profile mentoring card (Phase 03) already shows topics and slots; ensure the **Request a session** button opens the Connect dialog with kind MENTORSHIP and placeholder "One specific question for a short session".

### Step 8 — Notification bell and page (10 min)

**`NotificationBell`** (top bar):
- `useQuery({ queryKey: qk.unread, queryFn: () => api<{ count: number }>('/notifications/unread-count'), refetchInterval: 30_000 })`.
- Bell icon button with `aria-label="Notifications, 3 unread"`; red dot badge with count (max "9+").
- `Popover` (`w-96`, max height with `ScrollArea`): header "Notifications" + "Mark all as read"; list of the latest 8 (fetch on open): icon by type (ANSWER message-circle, COMMENT message-square, REQUEST user-plus, REQUEST_RESPONSE user-check, APPLICATION users, BADGE award in amber, OPPORTUNITY briefcase, SYSTEM info), bold title when unread with an indigo dot, body line, relative time. Click → mark that one read (optimistic) → navigate to `link` → close popover. Footer "See all" → `/notifications`.
- After reading, invalidate `qk.unread`.

**`/notifications`**: `PageHeader` "Notifications" + "Mark all as read"; grouped sections **Today · This week · Earlier**; filter chips (All · Answers · Requests · Teams · Opportunities · Badges); infinite "Load more"; empty state "You're all caught up ✨".

**Mobile:** the bell stays in the top bar; also show the unread count as a small dot on the "Me" tab.

Commit:

```bash
git add -A && git commit -m "phase-07: opportunities, alerts, teams, mentorship sessions, notifications" && git tag phase-07
```

---

## 6. UI quality checklist

- [ ] Deadline badges are instantly readable and colour-coded with text (not colour alone).
- [ ] Team cards show at a glance whether *you* fit (✓ skills) and which roles are needed — cross-department roles stand out.
- [ ] Founder track has its own identity (rocket icon, warm accent, advisors card).
- [ ] The notification popover is compact, scrollable, with clear unread styling; clicking navigates and closes it.
- [ ] Dialogs close on success with a toast and the relevant list refreshes.
- [ ] External links always open in a new tab with `rel="noopener noreferrer"` and only for `http(s)` URLs.

---

## 7. Completion criteria

- [ ] Opportunities: create, filter by type, sort, hide past deadlines, connect with poster.
- [ ] Alerts: saving preferences works; a matching new opportunity creates notifications only for matching users (not the author).
- [ ] Teams: create, apply (once), accept/reject, open-join, full/closed rules, close listing — with notifications.
- [ ] Founder track shows startup listings and alumni advisors; study circles join instantly when open.
- [ ] Mentorship completion awards 25 points once and the Mentor badge; follow-ups work.
- [ ] Bell count matches unread rows; marking read updates it; `/notifications` groups and filters.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 7.1 | As Ananya set alerts: types Hackathon; topics AI/ML | Saved; reopening the dialog shows the same choices |
| 7.2 | As Rahul post a Hackathon opportunity in AI/ML, deadline in 3 days | Appears on `/opportunities` with an amber "Closes in 3 days" badge; toast shows the number alerted |
| 7.3 | As Ananya check the bell within 30 s | New opportunity notification; clicking opens the post |
| 7.4 | As Karthik (no matching alerts) check notifications | No alert for this post |
| 7.5 | Filter Research; toggle Show past | Only research; past items appear only with the toggle |
| 7.6 | As Rahul create a hackathon team needing python + designer | Listing visible with "Looking for: Designer" |
| 7.7 | As Ananya toggle "Matches my skills" | Rahul's team shown with ✓ on python |
| 7.8 | Apply twice | Second attempt: "You already applied" (409) |
| 7.9 | As Rahul accept Ananya | Ananya notified "You're in!"; listed as a member; member count 2/4 |
| 7.10 | Fill a team to max members, apply as another user | "This team is full" |
| 7.11 | Create an open-join study circle, join as another user | Joined instantly; owner notified |
| 7.12 | Founder track tab | Startup listings + alumni advisors with Connect |
| 7.13 | As Meera (alumni) complete Ananya's accepted mentorship request | Status Completed; Meera +25 once; Mentor badge; Ananya notified |
| 7.14 | Click "Mark all as read" | Bell count 0 |
| 7.15 | Mobile 375px opportunities and teams | Tabs scroll; cards single column; dialogs become full-height sheets |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Alert notifications sent to the author | Exclude `post.authorId` in the subscription query |
| Applications unique error shows 500 | Make sure the error handler maps Prisma `P2002` to 409 with a friendly message |
| Bell count doesn't change after reading | Invalidate `qk.unread` after `markRead` |
| `nulls: 'last'` not supported | Sort in memory, or order by `deadline asc` and move nulls to the end in code |

---

## 10. If you're behind

- Skip `/opportunities/new` as a page (use a dialog) and the "Show past" toggle.
- Skip the founder-track advisors card (keep the Startup tab).
- Skip study-circle open-join (study circles use normal apply).
- Skip the `/notifications` page (keep the bell popover).
- Keep: opportunities with filters and connect-with-poster, alert preferences + notifications, team apply/accept, mentorship completion with points, the bell.
