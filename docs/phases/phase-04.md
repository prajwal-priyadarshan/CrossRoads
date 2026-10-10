# Phase 04 — Ask a Senior (alumni Q&A) and the community feed

| | |
|---|---|
| **Time box** | 1:15 (cumulative 4:55) |
| **Goal** | Students ask questions and get answers from seniors and alumni; similar answered questions appear before posting; everyone can post, comment, reply and vote in topic communities and tag pages; any author can be contacted from their post |
| **Prerequisites** | Phase 03 complete (ConnectDialog exists) |
| **PRD features** | F09 Ask a Senior, F10 Community feed, F11 Topics + follow + tags, F12 Connect with post authors, F13 Similar questions |
| **Requirements** | FR-ASK-1…6, FR-COM-1…5; your priority table rows (topic feed, posts, comments, votes, follow, connect with authors, Latest/Top); numbered feature 1 |
| **Reference** | `TRD.md` §6.2 (similar questions SQL), §8.4 (endpoints), §10.1 (gamification service), §10.2 (notifications) |


> **Implementation notes (verified build).** `viewerStateFor(viewerId, posts)` takes the post rows (it also computes `hasSeniorAnswer`); list endpoints return `{ data: { items, nextCursor } }`; a missing topic returns "Choose a topic". The gamification service is wired into connections too: accepting a request evaluates badges for both people and completing a mentorship awards `MENTOR_SESSION` points.

---

## 1. What you will have at the end of this phase

- Topics API with follow/unfollow and follower counts.
- Posts API: list with filters and sorts (Latest, Top this week, Top all time, Unanswered), create, detail with a comment tree, soft delete, comments and replies, best answer, similar questions.
- Votes API with toggle semantics, scores kept in sync, and optimistic UI.
- **Gamification service** (`awardPoints`, `grantBadge`, `evaluateBadges`) created now and used by answers, helpful votes and best answers. Later phases call it as they add contributions.
- Pages: `/ask`, `/ask/new`, `/ask/:id`, `/community`, `/community/:topic`, `/community/tag/:tag`, `/post/:id`.
- Seniors/alumni whose skills match a new question's tags are notified (max 20) — "relevant seniors respond".

---

## 2. Concepts in this phase

- **Questions are posts** with `kind = QUESTION`; **answers are top-level comments** on a question; replies are comments with `parentId`. One model, three experiences.
- **Votes are toggles.** `PUT /votes` with value `1`, `-1` or `0`. The service computes the delta and updates the target's `score` in the same transaction, so counts never drift.
- **"Helpful"** on an answer is simply an upvote on that comment, displayed with a thumbs-up for a friendlier Q&A feel.
- **Answer once, help every batch:** similar-question suggestions run while typing, before a duplicate question is created.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/services/gamification.ts` | Copy from `TRD.md` §10.1 |
| `src/modules/topics/topics.service.ts`, `topics.routes.ts` | List, follow, unfollow |
| `src/modules/posts/posts.service.ts` | `listPosts`, `createPost`, `getPost`, `deletePost`, `createComment`, `markBestAnswer`, `similarQuestions` |
| `src/modules/posts/posts.serializers.ts` | `toPostCard`, `toComment`, comment tree builder |
| `src/modules/posts/posts.routes.ts` | Routes |
| `src/modules/votes/votes.service.ts`, `votes.routes.ts` | `castVote` |
| `src/lib/pagination.ts` | `encodeCursor`, `decodeCursor` |
| `scripts/seed-users.ts` | Add topic follows for demo users |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/posts.ts` | `postCreateSchema`, `commentCreateSchema`, `postListQuerySchema`, `bestAnswerSchema` |
| `src/schemas/votes.ts` | `voteSchema`, `bookmarkSchema` |
| `src/types.ts` | `PostCard`, `PostDetail`, `CommentNode`, `TopicWithFollow` |

### Web

| File | Purpose |
|---|---|
| `src/features/community/api.ts` | `useTopics`, `useFollowTopic`, `usePosts` (infinite), `usePost`, `useCreatePost`, `useCreateComment`, `useDeletePost` |
| `src/features/ask/api.ts` | `useSimilarQuestions`, `useMarkBest` |
| `src/components/shared/VoteButtons.tsx` | Optimistic vote control (vertical and horizontal variants) |
| `src/features/community/PostCard.tsx` | Card for discussions, questions and opportunities |
| `src/features/community/Composer.tsx` | Collapsible "Start a discussion" composer |
| `src/features/community/TopicTabs.tsx`, `SortToggle.tsx` | Filters |
| `src/features/community/CommentThread.tsx` | Comments + one level of replies |
| `src/features/community/AuthorCard.tsx` | Right-rail author card with match and Connect |
| `src/features/community/CommunityPage.tsx`, `TopicPage.tsx`, `TagPage.tsx`, `PostPage.tsx` | Pages |
| `src/features/ask/AskListPage.tsx`, `AskNewPage.tsx`, `QuestionPage.tsx` | Pages |
| `src/features/ask/QuestionCard.tsx`, `AnswerCard.tsx`, `SimilarQuestions.tsx` | Components |
| `src/components/shared/TagInput.tsx` | Up to 5 tags with suggestions |
| `src/components/shared/PlainText.tsx` | Renders user text safely with paragraphs and auto-linked URLs |

---

## 4. Step-by-step — API

### Step 1 — Schemas (5 min)

`packages/shared/src/schemas/posts.ts`:

```ts
import { z } from 'zod';
const tag = z.string().trim().toLowerCase().min(1).max(30).regex(/^[a-z0-9+#./ -]+$/, 'Letters, numbers and spaces only');

export const postCreateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('QUESTION'),
    title: z.string().trim().min(10, 'At least 10 characters').max(200),
    body: z.string().trim().max(5000).default(''),
    topicId: z.coerce.number().int(),
    tags: z.array(tag).max(5).default([]),
  }),
  z.object({
    kind: z.literal('DISCUSSION'),
    title: z.string().trim().min(5).max(200),
    body: z.string().trim().max(10000).default(''),
    topicId: z.coerce.number().int(),
    tags: z.array(tag).max(5).default([]),
  }),
  z.object({
    kind: z.literal('OPPORTUNITY'),
    title: z.string().trim().min(5).max(200),
    body: z.string().trim().max(5000).default(''),
    topicId: z.coerce.number().int().optional(),
    tags: z.array(tag).max(5).default([]),
    opportunityType: z.enum(['INTERNSHIP', 'HACKATHON', 'RESEARCH', 'EVENT', 'REFERRAL', 'STUDY_GROUP', 'COLLABORATION', 'CAREER_GUIDANCE']),
    organization: z.string().trim().max(80).optional(),
    deadline: z.coerce.date().optional(),
    externalUrl: z.string().url().regex(/^https?:\/\//).optional().or(z.literal('')),
  }),
]);

export const commentCreateSchema = z.object({ body: z.string().trim().min(2, 'Write a little more').max(5000), parentId: z.string().uuid().optional() });

export const postListQuerySchema = z.object({
  kind: z.enum(['DISCUSSION', 'QUESTION', 'OPPORTUNITY']).optional(),
  topic: z.string().optional(),            // topic slug
  tag: z.string().optional(),
  author: z.string().optional(),           // handle
  sort: z.enum(['latest', 'top', 'top_all', 'unanswered']).default('latest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const bestAnswerSchema = z.object({ commentId: z.string().uuid() });
```

`packages/shared/src/schemas/votes.ts`:

```ts
import { z } from 'zod';
export const voteSchema = z.object({ targetType: z.enum(['POST', 'COMMENT']), targetId: z.string().uuid(), value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });
export const bookmarkSchema = z.object({ targetType: z.enum(['POST', 'EXPERIENCE', 'ROADMAP', 'STORY']), targetId: z.string().uuid() });
```

### Step 2 — Topics (5 min)

`topics.service.ts`:

```ts
export async function listTopics(userId: string) {
  const [topics, follows] = await Promise.all([
    prisma.topic.findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { followers: true, posts: true } } } }),
    prisma.topicFollow.findMany({ where: { userId }, select: { topicId: true } }),
  ]);
  const followed = new Set(follows.map((f) => f.topicId));
  return topics.map((t) => ({ id: t.id, slug: t.slug, name: t.name, description: t.description, icon: t.icon,
    followers: t._count.followers, posts: t._count.posts, followed: followed.has(t.id) }));
}
export const follow = (userId: string, topicId: number) =>
  prisma.topicFollow.upsert({ where: { userId_topicId: { userId, topicId } }, update: {}, create: { userId, topicId } });
export const unfollow = (userId: string, topicId: number) => prisma.topicFollow.deleteMany({ where: { userId, topicId } });
```

Routes: `GET /topics`, `POST /topics/:id/follow`, `DELETE /topics/:id/follow` (`Number(req.params.id)`; 404 if the topic doesn't exist).

Add topic follows for demo users in `seed-users.ts` (e.g. map interests → topic slugs: `ai/ml` → `ai-ml`, `competitive programming` → `dsa-leetcode`, everyone gets `campus-life`, final years get `placements`).

### Step 3 — Posts list, create, detail (15 min)

`src/lib/pagination.ts`:

```ts
export const encodeCursor = (createdAt: Date, id: string) => Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
export function decodeCursor(c?: string) {
  if (!c) return null;
  const [iso, id] = Buffer.from(c, 'base64url').toString().split('|');
  return iso && id ? { createdAt: new Date(iso), id } : null;
}
```

`posts.service.ts` (key parts):

```ts
const authorSelect = userLiteSelect;

export async function listPosts(viewerId: string, q: PostListQuery) {
  const where: Prisma.PostWhereInput = { isRemoved: false };
  if (q.kind) where.kind = q.kind;
  if (q.topic) where.topic = { slug: q.topic };
  if (q.tag) where.tags = { has: q.tag.toLowerCase() };
  if (q.author) where.author = { handle: q.author };
  if (q.sort === 'unanswered') { where.kind = 'QUESTION'; where.commentCount = 0; }
  if (q.sort === 'top') where.createdAt = { gte: new Date(Date.now() - 7 * 864e5) };

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    q.sort === 'top' || q.sort === 'top_all' ? [{ score: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }] : [{ createdAt: 'desc' }, { id: 'desc' }];

  // Cursor pagination for latest/unanswered; offset (via cursor = page number) for top sorts keeps it simple
  const cur = decodeCursor(q.cursor);
  if (cur && (q.sort === 'latest' || q.sort === 'unanswered')) {
    where.OR = [{ createdAt: { lt: cur.createdAt } }, { createdAt: cur.createdAt, id: { lt: cur.id } }];
  }

  const rows = await prisma.post.findMany({
    where, orderBy, take: q.limit + 1,
    skip: (q.sort === 'top' || q.sort === 'top_all') && q.cursor ? Number(q.cursor) : 0,
    include: { author: { select: authorSelect }, topic: { select: { id: true, slug: true, name: true, icon: true } } },
  });
  const hasMore = rows.length > q.limit;
  const items = rows.slice(0, q.limit);
  const viewerState = await viewerStateFor(viewerId, items.map((p) => p.id));
  const nextCursor = !hasMore ? null
    : q.sort === 'top' || q.sort === 'top_all' ? String((Number(q.cursor) || 0) + q.limit)
    : encodeCursor(items.at(-1)!.createdAt, items.at(-1)!.id);
  return { items: items.map((p) => toPostCard(p, viewerState)), nextCursor };
}

/** The viewer's votes and bookmarks for a set of posts, in two queries. */
export async function viewerStateFor(viewerId: string, postIds: string[]) {
  const [votes, bookmarks] = await Promise.all([
    prisma.vote.findMany({ where: { userId: viewerId, targetType: 'POST', targetId: { in: postIds } } }),
    prisma.bookmark.findMany({ where: { userId: viewerId, targetType: 'POST', targetId: { in: postIds } } }),
  ]);
  return { votes: new Map(votes.map((v) => [v.targetId, v.value])), bookmarks: new Set(bookmarks.map((b) => b.targetId)) };
}
```

`toPostCard(p, state)` returns: `id, kind, title, excerpt (body first 220 chars), topic, tags, author, score, commentCount, hasBestAnswer, opportunityType, organization, deadline, externalUrl, createdAt, myVote, bookmarked`.

**Create** (`createPost(userId, input)`):

1. Normalise tags (`normalizeTag`, unique).
2. Validate the topic exists (when given).
3. Insert in a transaction.
4. If `kind = QUESTION`: find up to 20 users with role SENIOR/ALUMNI, `skills hasSome tags` **or** following the topic, not the author, ordered by `points desc`; `notifyMany(… type 'ANSWER', title 'A junior asked a question you can help with', link '/ask/:id')`.
5. If `kind = OPPORTUNITY`: opportunity alerts (built in Phase 07 — leave a `// TODO Phase 07: notifyOpportunityAlerts(tx, post)` call site).
6. Return `{ id }`.

**Detail** (`getPost(viewerId, id)`): the post with author and topic; all comments (`isRemoved: false`) with authors ordered by `createdAt asc`; viewer votes for the post and every comment (one query with `targetId in [...]`); build the tree:

```ts
export function buildTree(comments: CommentRow[], myVotes: Map<string, number>, bestAnswerId: string | null) {
  const byId = new Map<string, CommentNode>();
  comments.forEach((c) => byId.set(c.id, { ...toComment(c), myVote: myVotes.get(c.id) ?? 0, isBest: c.id === bestAnswerId, replies: [] }));
  const roots: CommentNode[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.replies.push(c);
    else roots.push(c);
  }
  // For questions: best answer first, then by score, then oldest
  roots.sort((a, b) => Number(b.isBest) - Number(a.isBest) || b.score - a.score || +new Date(a.createdAt) - +new Date(b.createdAt));
  return roots;
}
```

Return `{ post: toPostCard(...) + body (full), comments: tree, canMarkBest: post.kind === 'QUESTION' && post.authorId === viewerId }`.

**Delete:** author or admin → `isRemoved = true`. 404 for others (don't reveal existence).

### Step 4 — Comments, answers and best answer (10 min)

```ts
export async function createComment(userId: string, postId: string, input: CommentCreateInput) {
  const post = await prisma.post.findFirst({ where: { id: postId, isRemoved: false } });
  if (!post) throw notFound('Post not found');
  if (input.parentId) {
    const parent = await prisma.comment.findFirst({ where: { id: input.parentId, postId, isRemoved: false } });
    if (!parent) throw badRequest('Reply target not found');
    if (parent.parentId) throw badRequest('Replies can only be one level deep'); // keeps the UI simple
  }
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({ data: { postId, authorId: userId, body: input.body, parentId: input.parentId } });
    await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true, role: true } });
    const link = post.kind === 'QUESTION' ? `/ask/${postId}` : `/post/${postId}`;

    if (post.authorId !== userId) {
      await notify(tx, {
        userId: post.authorId,
        type: post.kind === 'QUESTION' && !input.parentId ? 'ANSWER' : 'COMMENT',
        title: post.kind === 'QUESTION' && !input.parentId ? `${me.fullName} answered your question` : `${me.fullName} commented on your post`,
        body: post.title.slice(0, 100), link,
      });
    }
    if (input.parentId) {
      const parent = await tx.comment.findUniqueOrThrow({ where: { id: input.parentId } });
      if (parent.authorId !== userId && parent.authorId !== post.authorId)
        await notify(tx, { userId: parent.authorId, type: 'COMMENT', title: `${me.fullName} replied to you`, body: post.title.slice(0, 100), link });
    }
    let pointsEarned = 0;
    if (post.kind === 'QUESTION' && !input.parentId && post.authorId !== userId) {
      if (await awardPoints(tx, userId, 'ANSWER', POINTS.ANSWER, comment.id)) pointsEarned = POINTS.ANSWER;
      await evaluateBadges(tx, userId);
    }
    return { comment, pointsEarned };
  });
}
```

> Answering your own question earns no points (prevents gaming).

```ts
export async function markBestAnswer(userId: string, postId: string, commentId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, isRemoved: false } });
  if (!post || post.kind !== 'QUESTION') throw notFound();
  if (post.authorId !== userId) throw forbidden('Only the person who asked can choose the best answer');
  const answer = await prisma.comment.findFirst({ where: { id: commentId, postId, parentId: null, isRemoved: false } });
  if (!answer) throw badRequest('That answer is not on this question');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({ where: { id: postId }, data: { bestAnswerId: commentId } });
    if (answer.authorId !== userId) {
      await awardPoints(tx, answer.authorId, 'BEST_ANSWER', POINTS.BEST_ANSWER, commentId);
      await notify(tx, { userId: answer.authorId, type: 'ANSWER', title: 'Your answer was marked best 🎉', body: post.title.slice(0, 100), link: `/ask/${postId}` });
      await evaluateBadges(tx, answer.authorId);
    }
    return updated;
  });
}
```

Changing the best answer later is allowed; points already awarded for the previous one stay (keeps it simple and kind).

**Similar questions:** use the trigram query from `TRD.md` §6.2. Require `q.length ≥ 8`; return `[]` otherwise.

Routes:

```ts
postsRouter.get('/posts', requireOnboarded, validate({ query: postListQuerySchema }), …);
postsRouter.post('/posts', requireOnboarded, writeLimiter, validate({ body: postCreateSchema }), …);  // 201 { id }
postsRouter.get('/posts/:id', requireOnboarded, …);
postsRouter.delete('/posts/:id', requireOnboarded, …);
postsRouter.post('/posts/:id/comments', requireOnboarded, writeLimiter, validate({ body: commentCreateSchema }), …); // 201 { comment, pointsEarned }
postsRouter.post('/posts/:id/best-answer', requireOnboarded, validate({ body: bestAnswerSchema }), …);
postsRouter.get('/questions/similar', requireOnboarded, …); // ?q=
```

### Step 5 — Votes (8 min)

```ts
export async function castVote(userId: string, { targetType, targetId, value }: VoteInput) {
  // target must exist and not be removed
  const target = targetType === 'POST'
    ? await prisma.post.findFirst({ where: { id: targetId, isRemoved: false }, select: { id: true, authorId: true, kind: true } })
    : await prisma.comment.findFirst({ where: { id: targetId, isRemoved: false }, select: { id: true, authorId: true, parentId: true, post: { select: { kind: true } } } });
  if (!target) throw notFound();

  return prisma.$transaction(async (tx) => {
    const key = { userId_targetType_targetId: { userId, targetType, targetId } };
    const existing = await tx.vote.findUnique({ where: key });
    const old = existing?.value ?? 0;
    if (value === 0) { if (existing) await tx.vote.delete({ where: key }); }
    else if (existing) await tx.vote.update({ where: key, data: { value } });
    else await tx.vote.create({ data: { userId, targetType, targetId, value } });

    const delta = value - old;
    const updated = targetType === 'POST'
      ? await tx.post.update({ where: { id: targetId }, data: { score: { increment: delta } }, select: { score: true } })
      : await tx.comment.update({ where: { id: targetId }, data: { score: { increment: delta } }, select: { score: true } });

    // Helpful vote on an answer → +2 to the answer author, once per voter
    const isAnswer = targetType === 'COMMENT' && (target as any).post.kind === 'QUESTION' && !(target as any).parentId;
    if (isAnswer && value === 1 && target.authorId !== userId) {
      await awardPoints(tx, target.authorId, `HELPFUL:${userId}`, POINTS.HELPFUL_VOTE, targetId);
    }
    return { score: updated.score, myVote: value };
  });
}
```

> Removing a helpful vote doesn't take points back (simpler, and avoids anxiety). The unique ledger key stops re-vote farming.

Route: `PUT /votes` (`requireOnboarded`, `validate({ body: voteSchema })`).

---

## 5. Step-by-step — Web

### Step 6 — Shared pieces (10 min)

**`VoteButtons`** (`orientation: 'vertical' | 'horizontal'`, `variant: 'updown' | 'helpful'`):

```tsx
export function VoteButtons({ targetType, targetId, score, myVote, orientation = 'vertical', variant = 'updown', invalidate }: Props) {
  const qc = useQueryClient();
  const [state, setState] = useState({ score, myVote });
  useEffect(() => setState({ score, myVote }), [score, myVote]); // sync when server data changes

  const m = useMutation({
    mutationFn: (value: -1 | 0 | 1) => api<{ score: number; myVote: number }>('/votes', { method: 'PUT', json: { targetType, targetId, value } }),
    onMutate: (value) => {
      const prev = state;
      setState({ score: state.score - state.myVote + value, myVote: value }); // optimistic
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx) setState(ctx.prev); toast.error('Could not save your vote'); },
    onSuccess: (res) => setState(res),
    onSettled: () => invalidate && qc.invalidateQueries({ queryKey: invalidate }),
  });
  const click = (v: 1 | -1) => m.mutate(state.myVote === v ? 0 : v);
  // render: up arrow (active: text-primary fill), count (tabular, animate on change), down arrow (active: text-destructive)
  // helpful variant: a single "ThumbsUp Helpful · 12" pill button that toggles 1/0
}
```

`aria-pressed` on each button; `aria-label="Upvote"` / `"Downvote"` / `"Mark as helpful"`.

**`TagInput`**: wraps `ChipPicker` with `max={5}`, suggestions from `SKILLS` + `INTERESTS`, and hint "Add up to 5 tags so the right seniors see it".

**`PlainText`**: splits text into paragraphs on blank lines, keeps single line breaks, turns `https://…` into links (`target="_blank" rel="noopener noreferrer"`), never uses `dangerouslySetInnerHTML`.

**`PostCard`** (used everywhere, including the home feed later):
- Left: vertical `VoteButtons` (hidden on mobile; a horizontal one appears in the footer instead).
- Header line: topic chip (icon + name, links to `/community/:slug`) · author avatar (sm) + name (links to profile) + `RoleBadge` (Senior/Alumni highlighted with indigo text) · `RelativeTime`. Optional `ReasonChip` slot (used by the home feed in Phase 05).
- Kind indicator: questions get a small "Question" label in sky; opportunities get type icon + deadline badge (Phase 07).
- Title (`font-semibold text-[17px]` hover underline), excerpt (2-line clamp, muted).
- Tags (`#tag` small chips linking to `/community/tag/:tag`).
- Footer: comment/answer count (MessageSquare icon), "Answered" emerald pill if a best answer exists, `BookmarkButton` slot (Phase 05), overflow menu (Report — Phase 08, Delete for the author).
- Whole card links to `/ask/:id` (questions) or `/post/:id` (others).

### Step 7 — Ask a Senior pages (15 min)

**`/ask` (AskListPage)**
- `PageHeader` "Ask a Senior" / "Real answers from people who've been exactly where you are." Action: **Ask a question** (primary).
- Hero tip card for first years (dismissible, stored in `localStorage`): "Not sure what to ask? Try: 'Which clubs helped you most in first year?'"
- Tabs: **Unanswered** (seniors default) · **Newest** (students default) · **Top**.
- Topic filter chips (All + 6 topics).
- `QuestionCard` list: like `PostCard`, plus an answer-count block on the left ("3 answers" emerald when a best answer exists, outlined otherwise) and "Answered by a senior" indicator when any answer author is SENIOR/ALUMNI (add `hasSeniorAnswer` to the serializer: a cheap `exists` subquery or a count in the list query).
- Infinite scroll with a "Load more" button (`useInfiniteQuery`, `getNextPageParam: (last) => last.nextCursor ?? undefined`).

**`/ask/new` (AskNewPage)** — two-column layout on desktop (form left, helper panel right):
- Community guidelines callout at the top (small, muted): "Be kind. No ragging. Don't share confidential interview questions."
- **Title** input (10–200) with counter. As the user types (≥ 8 chars), `useSimilarQuestions(debouncedTitle)` (300 ms) fills the right panel.
- **Details** textarea (optional) — placeholder: "Add context: your year, what you've tried, what you're unsure about."
- **Topic** (required) — 6 selectable cards with icons (2 columns).
- **Tags** (`TagInput`).
- Submit "Post question" → navigate to `/ask/:id`; toast "Question posted — seniors who know this topic have been notified".
- **Right panel `SimilarQuestions`**: title "Already answered?"; up to 5 rows with title, answer count, "Best answer" emerald tag; each opens in a new tab; empty state "No similar questions — you're asking something new!"; Phase 09 adds the "Get an instant answer from seniors' past answers" button here.
- Mobile: the similar-questions panel appears **between** the title and details fields so it's seen before posting.

**`/ask/:id` (QuestionPage)**
- Question card: votes, topic, author (with Connect), time, title (`font-display text-2xl`), body (`PlainText`), tags, bookmark/report/delete menu.
- Slot for **AI summary of senior answers** (Phase 09; render nothing yet).
- "N answers" heading + sort note "Best answer first, then most helpful".
- `AnswerCard`:
  - Best answer: emerald left border (4px), "Best answer" label with check icon, slightly tinted background.
  - Author row: avatar, name, `RoleBadge` (**Senior** / **Alumni** in indigo-filled pill to stand out), verified badge, department · year/company, time.
  - Body (`PlainText`).
  - Footer: `VoteButtons variant="helpful"`; **Reply**; for the asker: **Mark as best**; for readers: **Request mentorship** (opens `ConnectDialog` with kind MENTORSHIP and topic prefilled with the question title); for the answer's author: **Offer mentorship** (opens `ConnectDialog` to the asker with kind MENTORSHIP, message prefilled "Happy to talk more about this — want to set up a short chat?").
  - Replies indented with a left rule; reply box inline.
- Answer composer at the bottom: textarea + "Post answer"; for first years show a hint "Seniors' answers are highlighted, but your experience counts too!"; for seniors: "Your answer will help every future batch."
- After posting: toast "Answer posted" — if `pointsEarned > 0`, toast "+5 helpfulness — thank you for helping!" with an amber star icon.
- Right rail (desktop): `AuthorCard` for the asker (avatar, role, match reasons, Connect) + "Related questions" (reuse similar-questions endpoint with the title).

### Step 8 — Community pages (12 min)

**`/community` (CommunityPage)**
- `PageHeader` "Community" / "Discuss, share and learn with your campus."
- `TopicTabs`: horizontally scrollable chips — All + 6 topics (icon + name); selecting navigates to `/community/:slug`.
- `SortToggle`: Latest · Top (this week) · Top (all time) as a segmented control.
- `Composer`: a card that looks like an input ("Start a discussion…" with avatar); clicking expands it to title, body, topic select, tags, and buttons "Cancel" / "Post". Questions are redirected: a small link "Asking for help? Use Ask a Senior →".
- Feed: `PostCard` list (kinds DISCUSSION and OPPORTUNITY; questions appear in Ask and in Home), "Load more".
- Right rail: "Your topics" (followed topics with follow toggles) and, from Phase 08, the Mentor wall.

**`/community/:topic` (TopicPage)**: topic header card (large icon in a soft square, name, description, "1.2k followers · 340 posts", **Follow / Following** button with optimistic toggle), then sort + composer (topic preselected) + feed.

**`/community/tag/:tag` (TagPage)**: header "#computer vision" with post count and a note "Tags act as lightweight communities"; feed filtered by tag across all kinds; sort toggle.

**`/post/:id` (PostPage)**: like `QuestionPage` but for discussions/opportunities: full post, `CommentThread` (comments with votes, one level of replies), right rail `AuthorCard` with match + **Connect** ("Connect with the author" — your "connect with post authors" requirement).

Invalidation after mutations:
- create post → `['posts']`, `['feed']` (Phase 05)
- create comment → `qk.post(id)`, `['posts']`
- best answer → `qk.post(id)`
- follow → `qk.topics`, `['feed']`

Commit:

```bash
git add -A && git commit -m "phase-04: ask a senior, community, votes, gamification service" && git tag phase-04
```

---

## 6. UI quality checklist

- [ ] Post and question cards have consistent spacing, a 2-line excerpt clamp and a readable meta row.
- [ ] Best answer is unmistakable but tasteful (emerald border + label), always first.
- [ ] Senior and alumni answers stand out through their role badge — first years can spot them instantly.
- [ ] The similar-questions panel animates in without shifting the form; on mobile it appears before the details field.
- [ ] Votes feel instant; the count animates; rapid double-clicks end in the correct state.
- [ ] Topic tabs scroll horizontally on mobile without a visible scrollbar and with fade edges.
- [ ] Long words and URLs in posts wrap (`break-words`) instead of overflowing.

---

## 7. Completion criteria

- [ ] Create question, discussion, comment, reply; delete own post.
- [ ] Vote toggling is correct (up→up removes; up→down changes by −2) and `score` equals the sum of `Vote.value` for that target.
- [ ] Only the asker can mark the best answer; points and notifications fire once.
- [ ] Similar questions appear for a near-duplicate title.
- [ ] Follow/unfollow works on topic pages; tag pages list tagged posts.
- [ ] Seniors with matching skills receive a notification row when a question is posted.
- [ ] Connect dialog opens from post authors and answers.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 4.1 | Seed (or create as Rahul) "Which coding club should I join in first year?" with an answer. As Ananya open `/ask/new` and type "which coding club to join" | The question appears in "Already answered?" with its answer count |
| 4.2 | Post a question without a topic | Inline error on Topic |
| 4.3 | Post a valid question tagged `python`, topic AI/ML | Redirect to detail; appears under Unanswered; Rahul (skill python) has an ANSWER notification row |
| 4.4 | As Rahul answer it | Toast "+5 helpfulness"; Ananya gets a notification; `PointsLedger` has ANSWER for Rahul; Rahul gets the First Answer badge |
| 4.5 | As Rahul look for "Mark as best" | Not visible; calling the endpoint returns 403 |
| 4.6 | As Ananya mark Rahul's answer best | Pinned with label; Rahul +15; notification |
| 4.7 | As Ananya click Helpful on the answer twice | Count +1 then back; Rahul gets +2 once in the ledger (second click doesn't add) |
| 4.8 | Upvote a post, then downvote it | Score changes +1, then −2 |
| 4.9 | Check `select score from "Post" where id=…` vs `select sum(value) from "Vote" where "targetId"=…` | Equal |
| 4.10 | `/community/ai-ml` → Follow | Button shows Following; follower count +1 (optimistic, then confirmed) |
| 4.11 | Click a tag chip `#python` | Tag page with all posts tagged python |
| 4.12 | Reply to a reply via the API (`parentId` of a reply) | 400 "Replies can only be one level deep" |
| 4.13 | From a discussion, click the author → Connect | Connect dialog opens for that author |
| 4.14 | Delete your own post | It disappears from lists; opening its URL shows "Post not found" |
| 4.15 | Paste a 300-character word into a post body | Text wraps; layout intact |
| 4.16 | Mobile 375px: ask flow | Similar questions show above details; votes in the footer |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `similarity()` function not found | `pg_trgm` not installed — run `npm run db:search` |
| `discriminatedUnion` errors on the client form | Use one form per kind (separate schemas `postCreateSchema.options[0]` etc.) or set `kind` as a hidden default |
| Best answer FK error | `bestAnswerId` must reference a comment on the same post (validated in the service) |
| Duplicate notifications | Make sure you don't notify the post author twice when the parent comment author is the post author |

---

## 10. If you're behind

- Skip replies (flat comments only) and the tag page.
- Skip "Top (all time)" (keep Latest and Top this week).
- Skip the "Related questions" rail.
- Keep: similar questions, best answer, helpful votes with points, connect from authors, topic follow.
