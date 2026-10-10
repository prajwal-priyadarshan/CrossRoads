# Phase 05 — Personalized home, This Week, Year 1 quests, bookmarks, trending and search

| | |
|---|---|
| **Time box** | 0:55 (cumulative 5:50) |
| **Goal** | Each user's home is a personalized, explained feed with topic filters, plus a right rail with This Week, private quests (or "Ways to help"), recommended people, pending requests, recent opportunities, trending topics, a story spotlight and quick links; bookmarks everywhere; search across all college knowledge with a ⌘K palette and a full search page with filters |
| **Prerequisites** | Phase 04 complete |
| **PRD features** | F14 Personalized home, F15 This Week, F16 Year 1 quests, F17 Bookmarks, F18 Trending topics, F19 Search |
| **Requirements** | FR-HOME-1…3, FR-WEEK-1, FR-QUEST-1, FR-BM-1, FR-SRCH-1…2; your Module E and numbered feature 9 |
| **Reference** | `TRD.md` §11.2 (feed ranking), §11.4 (quests), §6.2 (search SQL), §8.5 (endpoints) |

---

## 1. What you will have at the end of this phase

- `GET /feed?tab=foryou|latest|top&topic=` returning posts with one **reason** each.
- `GET /home/rail` returning everything the right rail needs in one call.
- `GET /events/week`, `PUT /bookmarks`, `GET /bookmarks`.
- `GET /search` (grouped results, filters: type, topic, company, department, batch).
- Home page, bookmarks page, search page, and a global Cmd/Ctrl+K command palette.

---

## 2. Concepts in this phase

- **Explain every recommendation.** The ranking function returns the strongest reason with each item. Showing it is the product's signature and builds trust.
- **One request for the rail.** The rail has 8 widgets; fetching them in one `Promise.all` on the server keeps the page fast and avoids 8 loading spinners.
- **Quests are computed, not stored.** They're derived from real data each time, so they're always correct and need no extra tables.
- **Search is just SQL.** PostgreSQL full-text search plus trigram similarity covers people, posts, experiences, teams, companies and stories well at campus scale.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/services/feedRank.ts` | `rankFeed`, `diversify` (`TRD.md` §11.2) |
| `src/services/quests.ts` | `computeQuests`, `computeWaysToHelp` |
| `src/modules/feed/feed.service.ts`, `feed.routes.ts` | Ranked feed |
| `src/modules/home/home.service.ts`, `home.routes.ts` | Right-rail bundle |
| `src/modules/events/events.service.ts`, `events.routes.ts` | This Week |
| `src/modules/bookmarks/bookmarks.service.ts`, `bookmarks.routes.ts` | Toggle + list (hydrated) |
| `src/modules/search/search.service.ts`, `search.routes.ts` | Unified search |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/search.ts` | `searchQuerySchema`, `feedQuerySchema` |
| `src/types.ts` | `FeedItem`, `RailData`, `Quest`, `SearchResults` |

### Web

| File | Purpose |
|---|---|
| `src/features/home/api.ts` | `useFeed` (infinite), `useRail` |
| `src/features/home/HomePage.tsx` | Page |
| `src/features/home/Greeting.tsx`, `ComposerCard.tsx`, `FeedTabs.tsx`, `FeedList.tsx` | Main column |
| `src/features/home/ThisWeek.tsx`, `QuestsCard.tsx`, `WaysToHelp.tsx`, `SuggestedPeople.tsx`, `PendingRequests.tsx`, `RecentOpportunities.tsx`, `TrendingTopics.tsx`, `StorySpotlight.tsx`, `QuickLinks.tsx` | Rail widgets |
| `src/components/shared/BookmarkButton.tsx` | Optimistic toggle |
| `src/features/bookmarks/BookmarksPage.tsx`, `api.ts` | Bookmarks |
| `src/components/layout/CommandPalette.tsx` | ⌘K palette |
| `src/features/search/SearchPage.tsx`, `api.ts` | Full search |
| `src/hooks/useHotkey.ts`, `useDebounce.ts` | Helpers |

---

## 4. Step-by-step — API

### Step 1 — Feed (12 min)

1. Copy `rankFeed` and `diversify` from `TRD.md` §11.2 into `src/services/feedRank.ts`.
2. `feed.service.ts`:

```ts
export async function getFeed(viewerId: string, q: { tab: 'foryou' | 'latest' | 'top'; topic?: string; cursor?: string }) {
  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    select: { id: true, role: true, currentYear: true, skills: true, interests: true, topicFollows: { select: { topicId: true } }, alertSubscription: true },
  });
  const followed = new Set(viewer.topicFollows.map((f) => f.topicId));
  const where: Prisma.PostWhereInput = { isRemoved: false, ...(q.topic ? { topic: { slug: q.topic } } : {}) };

  if (q.tab === 'latest' || q.tab === 'top') {
    return listPosts(viewerId, { sort: q.tab === 'latest' ? 'latest' : 'top', topic: q.topic, cursor: q.cursor, limit: 20 } as any);
  }

  // For you: rank the last 30 days in memory, page with an offset cursor
  const posts = await prisma.post.findMany({
    where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
    include: { author: { select: userLiteSelect }, topic: { select: { id: true, slug: true, name: true, icon: true } } },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const ranked = rankFeed(
    { role: viewer.role, currentYear: viewer.currentYear, skills: viewer.skills, interests: viewer.interests, alertTypes: viewer.alertSubscription?.opportunityTypes ?? [] },
    followed,
    posts as any,
  );
  const offset = Number(q.cursor ?? 0);
  const page = ranked.slice(offset, offset + 20);
  const state = await viewerStateFor(viewerId, page.map((p) => p.id));
  return {
    items: page.map((p) => ({ ...toPostCard(p as any, state), reason: p.reason })),
    nextCursor: offset + 20 < ranked.length ? String(offset + 20) : null,
  };
}
```

> If fewer than ~10 posts exist in the last 30 days (fresh database), widen the window to 180 days so the feed is never empty during the demo.

3. Route: `GET /feed` with `feedQuerySchema` (`tab`, `topic`, `cursor`).

### Step 2 — This Week (3 min)

```ts
export async function thisWeek(viewer: { currentYear: number | null; role: string }) {
  const year = viewer.role === 'ALUMNI' ? 5 : viewer.currentYear ?? 1;
  const now = new Date();
  return prisma.event.findMany({
    where: {
      startsAt: { gte: now, lte: new Date(now.getTime() + 7 * 864e5) },
      audienceYears: { has: year },
      category: { notIn: ['REUNION', 'CHAPTER_MEET'] }, // community events are shown in Phase 11's events page
    },
    orderBy: { startsAt: 'asc' },
    take: 8,
  });
}
```

Route: `GET /events/week`.

### Step 3 — Quests and ways to help (8 min)

`src/services/quests.ts`:

```ts
export async function computeQuests(userId: string, visitedClubs = 0) {
  const [u, follows, questions, requests, saves, reviews] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { skills: true, bio: true } }),
    prisma.topicFollow.count({ where: { userId } }),
    prisma.post.count({ where: { authorId: userId, kind: 'QUESTION' } }),
    prisma.connection.count({ where: { requesterId: userId } }),
    prisma.roadmapSave.count({ where: { userId } }),
    prisma.clubReview.count({ where: { authorId: userId } }),
  ]);
  const quests = [
    { id: 'profile', label: 'Complete your profile', hint: '3+ skills and a short bio', done: u.skills.length >= 3 && u.bio.length >= 20, href: '/settings/profile' },
    { id: 'topics', label: 'Follow 3 topics', hint: 'Personalise your feed', done: follows >= 3, href: '/community' },
    { id: 'ask', label: 'Ask your first question', hint: 'Seniors are happy to help', done: questions >= 1, href: '/ask/new' },
    { id: 'clubs', label: 'Explore 3 clubs', hint: 'See honest reviews from seniors', done: visitedClubs >= 3 || reviews >= 1, href: '/clubs' },
    { id: 'request', label: 'Reach out to someone', hint: 'Send your first request', done: requests >= 1, href: '/people' },
    { id: 'roadmap', label: 'Save a roadmap', hint: 'Know what to do next', done: saves >= 1, href: '/roadmaps' },
  ];
  return { items: quests, done: quests.filter((q) => q.done).length, total: quests.length };
}

export async function computeWaysToHelp(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { skills: true } });
  const [unanswered, pending, myReviews, clubs, hasJourneyJob, experiences] = await Promise.all([
    prisma.post.count({ where: { kind: 'QUESTION', isRemoved: false, commentCount: 0, tags: { hasSome: u.skills } } }),
    prisma.connection.count({ where: { recipientId: userId, status: 'PENDING' } }),
    prisma.clubReview.count({ where: { authorId: userId } }),
    prisma.club.count(),
    prisma.milestone.count({ where: { userId, category: { in: ['JOB', 'INTERNSHIP'] } } }),
    prisma.experience.count({ where: { authorId: userId } }),
  ]);
  return [
    { id: 'answer', label: `${unanswered} unanswered question${unanswered === 1 ? '' : 's'} in your skills`, href: '/ask?tab=unanswered', show: unanswered > 0 },
    { id: 'requests', label: `${pending} pending request${pending === 1 ? '' : 's'}`, href: '/requests', show: pending > 0 },
    { id: 'clubs', label: 'Review the clubs you were part of', href: '/clubs', show: myReviews < Math.min(3, clubs) },
    { id: 'experience', label: 'Share an interview experience', href: '/experiences/new', show: hasJourneyJob > 0 && experiences === 0 },
  ].filter((w) => w.show);
}
```

The client sends `visitedClubs` (from `localStorage`) as a query parameter to the rail endpoint.

### Step 4 — Rail bundle (5 min)

`home.service.ts`:

```ts
export async function getRail(viewer: SessionUser, visitedClubs: number) {
  const isFirstYearish = viewer.role === 'STUDENT' && (viewer.currentYear ?? 1) <= 1;
  const [week, quests, ways, suggested, pending, opportunities, trending, spotlight] = await Promise.all([
    thisWeek(viewer),
    isFirstYearish ? computeQuests(viewer.id, visitedClubs) : null,
    ['SENIOR', 'ALUMNI'].includes(viewer.role) ? computeWaysToHelp(viewer.id) : null,
    suggestedPeople(viewer.id, 3),
    prisma.connection.findMany({ where: { recipientId: viewer.id, status: 'PENDING' }, take: 2, orderBy: { createdAt: 'desc' },
      include: { requester: { select: userLiteSelect } } }),
    prisma.post.findMany({ where: { kind: 'OPPORTUNITY', isRemoved: false, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, opportunityType: true, deadline: true, organization: true } }),
    prisma.$queryRaw<Array<{ slug: string; name: string; icon: string; activity: bigint }>>`
      SELECT t.slug, t.name, t.icon, count(*) AS activity
      FROM "Post" p JOIN "Topic" t ON t.id = p."topicId"
      WHERE p."createdAt" > now() - interval '7 days' AND p."isRemoved" = false
      GROUP BY t.slug, t.name, t.icon ORDER BY activity DESC LIMIT 5`,
    prisma.story.findFirst({ where: { status: 'PUBLISHED', isSpotlight: true, isRemoved: false }, orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, excerpt: true, coverUrl: true } }),
  ]);
  return {
    thisWeek: week, quests, waysToHelp: ways, suggested, pendingRequests: pending, opportunities,
    trending: trending.map((t) => ({ ...t, activity: Number(t.activity) })), // bigint → number for JSON
    spotlight,
  };
}
```

> `count(*)` returns a `bigint`, which `JSON.stringify` can't serialize. Always convert it to `Number` (as above).

Route: `GET /home/rail?visitedClubs=2`.

### Step 5 — Bookmarks (5 min)

`toggleBookmark(userId, { targetType, targetId })`: check the target exists (post/experience/roadmap/story, not removed) → delete if present, else create → return `{ bookmarked }`.

`listBookmarks(userId, type?)`: fetch bookmark rows (newest first), group ids by type, load each type in one query, return `{ posts: PostCard[], experiences: [...], roadmaps: [...], stories: [...] }` keeping bookmark order. Removed targets are skipped.

Routes: `PUT /bookmarks`, `GET /bookmarks?type=`.

### Step 6 — Unified search (10 min)

`packages/shared/src/schemas/search.ts`:

```ts
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  type: z.enum(['all', 'question', 'post', 'opportunity', 'experience', 'team', 'person', 'company', 'story']).default('all'),
  topic: z.string().optional(),
  company: z.string().optional(),     // company slug (filters experiences and people)
  department: z.string().optional(),  // people + authors
  batch: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});
```

`search.service.ts` runs one query per type (only the requested type when `type ≠ all`), each limited, in `Promise.all`. All queries use `prisma.$queryRaw` tagged templates (parameterised) or Prisma `contains` filters:

| Type | Query | Filters applied |
|---|---|---|
| question / post / opportunity | Full-text on `title || body` (§6.2) + `kind` | topic slug (join Topic), author department/batch (join User) |
| experience | Full-text on `role || tips || rounds::text` | company slug |
| team | Full-text on `title || description`, `status = OPEN`, not removed | — |
| person | `fullName/company/jobTitle/bio ILIKE` or `skills @> ARRAY[lower(q)]` | department, batch, company |
| company | `similarity(name, q) > 0.2 OR name ILIKE %q%` | — |
| story | Full-text on title/excerpt/body, published | — |

Return shape:

```ts
type SearchResults = Record<'questions' | 'posts' | 'opportunities' | 'experiences' | 'teams' | 'people' | 'companies' | 'stories',
  Array<{ id: string; title: string; subtitle: string; url: string }>>;
```

Each result includes a ready-to-use `url` (`/ask/:id`, `/post/:id`, `/companies/:slug#exp-:id`, `/teams/:id`, `/u/:handle`, `/companies/:slug`, `/stories/:slug`).

> For dynamic `WHERE` parts in raw SQL, build them with `Prisma.sql` and `Prisma.empty`, for example:
> ```ts
> const topicFilter = q.topic ? Prisma.sql`AND t.slug = ${q.topic}` : Prisma.empty;
> ```
> Never interpolate user input into a plain string.

Route: `GET /search` with `searchQuerySchema`.

---

## 5. Step-by-step — Web

### Step 7 — Home page (15 min)

Layout: `RightRail` grid — main column (feed) and a 320px sticky rail. On mobile the rail's **This Week** and **Quests** cards appear after the 3rd feed item, and the rest at the bottom.

**Main column**

1. `Greeting`: "Good evening, Ananya" (time-of-day greeting) + a short contextual line:
   - First year: "Here's what matters for you this week."
   - Senior/alumni: "{N} juniors could use your help today." (from ways to help)
   - Everyone else: "Pick up where you left off."
2. `ComposerCard`: avatar + two large buttons: **Ask a senior** (→ `/ask/new`) and **Start a discussion** (→ opens the community composer in a dialog), plus a small **Share an opportunity** link.
3. `FeedTabs`: segmented control **For you · Latest · Top this week** (URL `?tab=`), and topic filter chips (All + followed topics first, then others) — "topic filters" from your Module E.
4. `FeedList`: `PostCard` with the `reason` shown as a `ReasonChip` in the card header; "Load more"; skeletons on load.
5. Empty state for new users with no follows: "Follow a few topics to personalise your feed" with the 6 topics as follow chips inline (optimistic follow, then refetch feed).

**Right rail widgets** (each a `Card` with a small heading and a "See all" link):

| Widget | Shown to | Content |
|---|---|---|
| `ThisWeek` | Everyone | Events grouped by day ("Today", "Tomorrow", "Fri"), coloured category dot (club amber, exam rose, hackathon indigo, placement emerald, deadline orange, event sky, webinar violet), title, time, countdown ("in 2 days"), external link icon. Empty: "A quiet week — explore clubs?" |
| `QuestsCard` | First years | "Your first-year quests" + progress ring/bar "3 of 6"; checklist with check icons (done items muted with strike-through); each open item links to where it's done; encouraging copy that changes with progress ("Great start!", "You're settling in well", "All done — you're a natural!") |
| `WaysToHelp` | Seniors/alumni | List of actionable rows from `computeWaysToHelp` with icons and arrows |
| `SuggestedPeople` | Everyone | 3 compact person rows: avatar, name, role, `MatchRing size=32`, one reason, small Connect button |
| `PendingRequests` | If any | 2 latest incoming requests with Accept/Decline inline (optimistic) |
| `RecentOpportunities` | Everyone | 3 latest open opportunities with type icon and deadline badge |
| `TrendingTopics` | Everyone | Top 5 topics this week with activity counts ("24 posts") |
| `StorySpotlight` | If a spotlight story exists (Phase 08) | Cover image, title, excerpt, "Read story" |
| `QuickLinks` | Everyone | "Update skills & interests" (→ `/settings/profile#skills`), "Edit my goals" (`#goals`), "Notification settings" (`/opportunities?alerts=1`), "Find a mentor" (`/people?mode=mentor`) |

`useRail()` reads `visitedClubs` from `localStorage` (key `bu-visited-clubs`, a JSON array of slugs written by the club page in Phase 06) and passes its length.

### Step 8 — Bookmarks (5 min)

`BookmarkButton` (`targetType`, `targetId`, `bookmarked`): icon button (`Bookmark` / filled `BookmarkCheck` in indigo), optimistic, toast "Saved to bookmarks" / "Removed". Add it to `PostCard`, question and post detail pages now; experience, roadmap and story cards get it in later phases.

`/bookmarks`: `PageHeader` "Bookmarks" + tabs **Posts & questions · Experiences · Roadmaps · Stories** with counts; each tab renders the matching card component; empty states per tab ("Save useful posts with the bookmark icon").

### Step 9 — Command palette and search page (10 min)

**`CommandPalette`** (shadcn `CommandDialog`):

- Opens on ⌘K / Ctrl+K (`useHotkey`) or the top-bar search button; closes on Escape or selection.
- Empty input: "Quick actions" group — Ask a question, Find a mentor, Browse companies, My prep, Share an experience — and "Try searching: dsa roadmap, google interview, robotics club".
- Typing (≥ 2 characters, debounced 250 ms) → `GET /search?q=…&limit=4` → groups in this order with icons: Questions, People, Companies, Experiences, Opportunities, Posts, Teams, Stories.
- Each item shows title + muted subtitle; Enter navigates; the last item is "See all results for '…'" → `/search?q=…`.
- Important: set `shouldFilter={false}` on the `Command` component so cmdk doesn't re-filter server results (⚠️ check the prop name in your cmdk version).

**`/search` (SearchPage)**:

- Large search input at the top (synced with `?q=`).
- Type tabs: All · Questions · Posts · Opportunities · Experiences · Teams · People · Companies · Stories.
- Filter row (shown when relevant): Topic (`Select`), Company (`Select`), Department (`Select`), Batch (`Select`) — "filters for topic, company, department, batch and post type" from your notes.
- Results: on "All", grouped sections with up to 6 results each and "See all {type}" links; on a type tab, a full list (limit 20).
- Highlight the matched words in titles (split on the query terms, wrap matches in `<mark className="bg-accent text-accent-foreground rounded px-0.5">`; plain text only).
- Empty state: "Nothing found for '…'. Try fewer words, or ask the community" with a button to `/ask/new?title=…` (prefill the title).

Commit:

```bash
git add -A && git commit -m "phase-05: home feed, this week, quests, bookmarks, search" && git tag phase-05
```

---

## 6. UI quality checklist

- [ ] Every feed card shows at most one reason chip, aligned in the card header.
- [ ] This Week feels urgent but calm: colour dots, clear dates, countdowns, no alarm red except exams.
- [ ] Quests copy is encouraging, never pressuring; nothing about quests is visible to other users.
- [ ] The rail is sticky on desktop and never overlaps the footer; on mobile, important rail cards appear early in the feed.
- [ ] Home never shows a blank screen: skeletons for the feed and each rail card.
- [ ] Palette opens instantly, is fully keyboard-driven, and closes after navigation.
- [ ] Search highlights matched words; empty state offers a next step.

---

## 7. Completion criteria

- [ ] "For you" order changes when the viewer follows/unfollows a topic; reasons are correct (spot-check 5 cards).
- [ ] Latest is strictly reverse-chronological; Top this week is ordered by score.
- [ ] This Week shows only the next 7 days for the viewer's year.
- [ ] Quests reflect real data and update after the action (invalidate `qk.rail` after posting, following, requesting, saving).
- [ ] Bookmarks persist and appear in `/bookmarks` grouped by type.
- [ ] Search returns grouped results across at least 5 types, and filters narrow results.
- [ ] `/home/rail` responds in one request; no `bigint` serialization errors.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 5.1 | As Ananya (follows AI/ML) open `/home` | AI/ML posts near the top with "Because you follow AI/ML" |
| 5.2 | Unfollow AI/ML (topic page), return home | Those posts drop; their chips change or disappear |
| 5.3 | Click "Latest" | Strict newest-first order |
| 5.4 | Choose the "Placements" topic chip | Only placement posts |
| 5.5 | Check This Week | Next-7-day events for year 1 only (e.g. freshers meet, coding club recruitment), sorted, correct countdowns |
| 5.6 | As Ananya ask a first question, return home | Quest "Ask your first question" ticked; progress increases |
| 5.7 | As Rahul open home | "Ways to help" instead of quests, e.g. "2 unanswered questions in your skills" |
| 5.8 | Bookmark a post, open `/bookmarks` | Post listed under Posts & questions; un-bookmark removes it |
| 5.9 | Press Ctrl+K, type "python" | People with Python, posts/questions mentioning Python; Enter opens the selected result |
| 5.10 | Search "northwind" on `/search`, choose Experiences | Experiences for that company (after Phase 06 content); filter Company works |
| 5.11 | Search for a nonsense word | Empty state with "Ask the community" prefilled |
| 5.12 | New user with no follows | Feed empty state with inline follow chips; following one refreshes the feed |
| 5.13 | Mobile 375px home | Feed first; This Week and Quests appear after 3 posts; no horizontal scroll |
| 5.14 | Network tab on home load | One `/feed` and one `/home/rail` request (plus `/auth/me`) |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `TypeError: Do not know how to serialize a BigInt` | Convert `count(*)` results with `Number()` |
| Palette shows nothing although the API returns results | cmdk is filtering client-side; disable its filtering |
| Feed empty on a fresh database | Widen the "For you" window (180 days) or seed content (Phase 10) |
| Rail quests don't update | Invalidate `qk.rail` in the relevant mutations' `onSuccess` |

---

## 10. If you're behind

- Skip trending topics, story spotlight and quick links.
- Skip the full `/search` page (keep the palette, which covers the demo).
- Skip the diversity pass in the feed.
- Keep: For you with reasons, This Week, quests/ways to help, suggested people, pending requests, bookmarks button.
