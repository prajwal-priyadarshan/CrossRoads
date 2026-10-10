# Phase 09 — AI layer, placement dashboard and campus OA / interview simulator

| | |
|---|---|
| **Time box** | 1:20 (cumulative 10:20) |
| **Goal** | AI that is grounded in your college's own knowledge — instant answers from seniors' past answers with citations, summaries of threads and company experiences, an Experience-to-Roadmap generator that explains skill gaps — plus a personalised placement dashboard (OA, aptitude, technical and HR prep tracked separately) and a campus-specific simulator whose questions come from alumni experiences |
| **Prerequisites** | Phase 08 complete; seeded answers, roadmaps, journeys and experiences exist; an Anthropic API key (optional — every feature has a fallback) |
| **PRD features** | F40 AI answer assistant, F41 AI summaries, F42 Experience-to-Roadmap, F25 Roadmaps by goal (AI part), F43 Placement dashboard, F44 OA and interview simulator |
| **Requirements** | FR-AI-1…3, FR-RMGEN-1, FR-DASH-1, FR-SIM-1…3; your priority row "AI-generated summaries" and the whole "Campus-Specific Placement Intelligence" section |
| **Reference** | `TRD.md` §12 (AI design and prompts), §11.5 (readiness), §11.6 (simulator), §8.9 (endpoints) |

> ⚠️ **Verify before coding:** the `@anthropic-ai/sdk` package's current `messages.create` options, content block types, request options for cancellation, and the current model ids in the Claude docs. Don't rely on remembered syntax. Build and test each feature's **fallback first**, then add AI on top.

---

## 1. What you will have at the end of this phase

- `lib/ai.ts` wrapper with JSON validation, timeout and graceful errors; AI rate limit.
- `POST /ai/answer` + "AI summary of senior answers" panel on `/ask/new` and question pages.
- `POST /ai/summary` for long threads and for a company's experiences (cached).
- `POST /roadmaps/generate` + `/roadmaps/generate` page: semester plan, skill gaps with priorities and reasons, steps mapped to projects, resources and practice tasks; deterministic fallback.
- `/prep` placement dashboard: target companies and roles, readiness per company, four prep tracks (OA · Aptitude · Technical · HR) with checklists, deadlines, next actions, recent simulations, year-adapted copy.
- `/prep/simulator`: choose company and round → adaptive questions with source experience and year → feedback, rubric, explanation → session summary with topics to revise.

---

## 2. Concepts in this phase

- **Grounding.** The model only sees what you retrieved from your database and must cite it. This keeps answers campus-specific and limits made-up facts.
- **Validate, then trust.** Every AI response must parse as JSON and pass a zod schema. If not, the user gets the fallback — never a broken screen.
- **Deterministic first.** Readiness, next actions and difficulty adaptation are plain arithmetic. AI only writes text (answers, plans, questions, feedback).
- **Original practice questions.** The simulator writes *new* questions on the *topics* seniors reported; it never reproduces confidential questions verbatim.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/lib/ai.ts` | `generateJSON` (`TRD.md` §12.2) + `AIError` |
| `src/lib/cache.ts` | Tiny in-memory TTL cache |
| `src/services/retrieval.ts` | `getRelatedAnswers` (`TRD.md` §12.4) |
| `src/modules/ai/ai.service.ts`, `ai.routes.ts` | Answer + summaries |
| `src/services/roadmapBuilder.ts` | `gatherContext`, `deterministicRoadmap`, `aiRoadmap` |
| `src/modules/roadmaps/roadmaps.routes.ts` | Add `POST /roadmaps/generate` |
| `src/services/readiness.ts` | Readiness + next actions (`TRD.md` §11.5) |
| `src/modules/prep/prep.service.ts`, `prep.routes.ts` | Dashboard, targets, prep items, import from company |
| `src/services/simulator.ts` | `pickTopics`, `generateQuestion`, `gradeAnswer`, `adaptDifficulty`, `summarise` |
| `src/services/questionBank.ts` | Fallback questions per round type (no AI) |
| `src/modules/sim/sim.service.ts`, `sim.routes.ts` | Sessions |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/ai.ts` | Request schemas + AI output schemas (`aiAnswerOut`, `aiSummaryOut`, `aiRoadmapOut`, `aiQuestionOut`, `aiGradeOut`) |
| `src/schemas/prep.ts` | `targetsSchema`, `prepItemSchema`, `prepItemUpdateSchema` |
| `src/schemas/sim.ts` | `simStartSchema`, `simAnswerSchema` |

### Web

| File | Purpose |
|---|---|
| `src/features/ask/AiAnswerPanel.tsx` | Answer panel with citations |
| `src/features/community/AiSummaryCard.tsx` | Thread / company summary card |
| `src/features/roadmaps/RoadmapGeneratePage.tsx`, `GapsCard.tsx` | Generator + gaps |
| `src/features/prep/PrepDashboardPage.tsx`, `TargetsCard.tsx`, `ReadinessCard.tsx`, `PrepTrack.tsx`, `NextActions.tsx`, `DeadlinesCard.tsx`, `RecentSims.tsx`, `api.ts` | Dashboard |
| `src/features/prep/SimulatorSetupPage.tsx`, `SimulatorSessionPage.tsx`, `QuestionView.tsx`, `FeedbackView.tsx`, `SessionSummary.tsx` | Simulator |

---

## 4. Step-by-step — API

### Step 1 — AI wrapper, cache and limits (8 min)

```bash
npm i @anthropic-ai/sdk -w apps/api
```

`.env`: `ANTHROPIC_API_KEY=…`, `AI_MODEL=<current model id from the Claude docs, e.g. claude-sonnet-5-5>`, `AI_TIMEOUT_MS=20000`.

1. Copy `generateJSON` from `TRD.md` §12.2 into `src/lib/ai.ts`.
2. `src/lib/cache.ts`:

```ts
const store = new Map<string, { at: number; value: unknown }>();
export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  return fn().then((value) => { store.set(key, { at: Date.now(), value }); return value; });
}
```

3. Apply `aiLimiter` (Phase 02) to every AI route **after** `requireOnboarded` (so the key is the user id). Set its limit to 20/hour.

### Step 2 — AI answer assistant (12 min)

`src/services/retrieval.ts`:

```ts
export async function getRelatedAnswers(title: string, body = '', excludePostId?: string) {
  const text = `${title} ${body}`.slice(0, 300);
  const [byTitle, byText] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Post"
      WHERE kind = 'QUESTION' AND "isRemoved" = false AND similarity(title, ${title}) > 0.12
      ORDER BY similarity(title, ${title}) DESC LIMIT 8`,
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Post"
      WHERE kind = 'QUESTION' AND "isRemoved" = false
        AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')) @@ websearch_to_tsquery('english', ${text})
      LIMIT 8`,
  ]);
  const ids = [...new Set([...byTitle, ...byText].map((r) => r.id))].filter((id) => id !== excludePostId);
  if (!ids.length) return [];
  const questions = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: {
      bestAnswer: { include: { author: { select: userLiteSelect } } },
      comments: { where: { parentId: null, isRemoved: false, score: { gte: 1 } }, orderBy: { score: 'desc' }, take: 1, include: { author: { select: userLiteSelect } } },
    },
  });
  return questions
    .map((q) => ({ q, a: q.bestAnswer && !q.bestAnswer.isRemoved ? q.bestAnswer : q.comments[0] }))
    .filter((x) => x.a)
    .slice(0, 6)
    .map((x, i) => ({
      n: i + 1, questionId: x.q.id, questionTitle: x.q.title,
      answer: x.a!.body.slice(0, 600), author: x.a!.author, isBest: x.q.bestAnswerId === x.a!.id,
    }));
}
```

> `websearch_to_tsquery` with a long sentence requires all words by default, which can miss matches. If results are thin, split the text into its 5 longest words and join them with ` OR ` before passing it in (websearch syntax supports `OR`).

`ai.service.ts`:

```ts
const aiAnswerOut = z.object({ answer: z.string().min(1).max(1500), citations: z.array(z.number().int()).max(6) });

export async function answer(viewerId: string, input: { questionId?: string; title?: string; body?: string }) {
  let title = input.title ?? '', body = input.body ?? '', exclude: string | undefined;
  if (input.questionId) {
    const p = await prisma.post.findFirst({ where: { id: input.questionId, kind: 'QUESTION', isRemoved: false } });
    if (!p) throw notFound();
    title = p.title; body = p.body; exclude = p.id;
  }
  const sources = await getRelatedAnswers(title, body, exclude);
  if (!sources.length) return { status: 'no_sources' as const, sources: [] };
  if (!aiEnabled) return { status: 'fallback' as const, sources };

  const key = `answer:${input.questionId ?? title.toLowerCase()}`;
  try {
    const out = await cached(key, 60 * 60_000, () =>
      generateJSON({
        system: ANSWER_SYSTEM_PROMPT, // TRD §12.3
        user: `Question: ${title}\nDetails: ${body || 'none'}\nSources:\n` +
          sources.map((s) => `[${s.n}] (${roleLabel(s.author)}, ${s.author.department ?? ''}) ${s.answer}`).join('\n'),
        schema: aiAnswerOut,
        maxTokens: 600,
      }));
    const valid = out.citations.filter((c) => sources.some((s) => s.n === c)); // drop invented citations
    return { status: 'ok' as const, answer: out.answer, citations: valid, sources };
  } catch {
    return { status: 'fallback' as const, sources };
  }
}
```

> Never send emails, phone numbers or LinkedIn URLs to the model — only answer text, role and department.

Route: `POST /ai/answer` (`requireOnboarded`, `aiLimiter`, validate `{ questionId? } | { title, body? }`).

### Step 3 — AI summaries (6 min)

`summary(viewerId, { postId } | { companySlug })`:
- **Thread:** the post + up to 30 comments (≥ 8 comments required, else 400 "This thread is short enough to read"). Number comments 1..n.
- **Company:** the company's experiences (max 15, newest first): role, year, round names, types, topics, difficulty, tips. Number them.
- Prompt from `TRD.md` §12.3 → `{ bullets: string[] (≤ 5), citations: number[] }`.
- Cache company summaries 24 h (`summary:company:{slug}:{experienceCount}` so new experiences refresh it), thread summaries 1 h.
- **Fallback (company):** compute deterministic bullets: "Most common topics: arrays, dbms, os (from 9 experiences)", "Average difficulty 3.4/5", "Typical prep ~6 weeks", "Rounds usually: OA → Technical ×2 → HR". (Write this function first — it's also useful when AI is off.)
- **Fallback (thread):** return `{ status: 'fallback' }` and hide the card.

Route: `POST /ai/summary`.

### Step 4 — Experience-to-Roadmap generator (15 min)

`src/services/roadmapBuilder.ts`:

```ts
export async function gatherContext(userId: string, input: { goalTrack: GoalTrack; targetRole?: string; targetCompanySlugs?: string[] }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currentYear: true, department: true, skills: true, interests: true, targetCompanies: true } });
  const slugs = input.targetCompanySlugs?.length ? input.targetCompanySlugs : user.targetCompanies;
  const [roadmaps, companies, twins] = await Promise.all([
    prisma.roadmap.findMany({ where: { goalTrack: input.goalTrack, isPublic: true, isAi: false }, orderBy: { saveCount: 'desc' }, take: 3 }),
    prisma.company.findMany({ where: { slug: { in: slugs } }, include: { experiences: { where: { isRemoved: false }, orderBy: { year: 'desc' }, take: 5 } } }),
    findTwins(userId).then((t) => t.twins.slice(0, 3)),   // alumni journeys
  ]);
  const semester = Math.min(8, Math.max(1, ((user.currentYear ?? 1) - 1) * 2 + (new Date().getMonth() >= 6 ? 1 : 2))); // ⚠️ adjust to your academic calendar
  return { user, semester, roadmaps, companies, twins, targetRole: input.targetRole };
}

export function computeGaps(ctx: Ctx) {
  const counts = new Map<string, number>();
  for (const c of ctx.companies) for (const s of c.skillsTested) if (!ctx.user.skills.includes(s)) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, n]) => ({
      skill,
      why: `Tested by ${n} of your ${ctx.companies.length} target compan${ctx.companies.length === 1 ? 'y' : 'ies'}`,
      priority: n >= 2 ? 'high' : 'medium',
    }));
}

export function deterministicRoadmap(ctx: Ctx, goalTrack: GoalTrack) {
  const base = ctx.roadmaps[0];
  const steps = ((base?.steps as RoadmapStep[]) ?? [])
    .filter((s) => s.semester >= ctx.semester)
    .map((s) => ({ ...s, id: randomUUID() }));
  // add one PRACTICE step per high-priority gap, plus company prep items
  const gaps = computeGaps(ctx);
  gaps.filter((g) => g.priority === 'high').slice(0, 4).forEach((g, i) =>
    steps.push({ id: randomUUID(), title: `Learn ${titleCase(g.skill)}`, detail: g.why, semester: Math.min(8, ctx.semester + i), kind: 'SKILL', resources: [] }));
  for (const c of ctx.companies) for (const p of (c.prepRoadmap as any[]).slice(0, 2))
    steps.push({ id: randomUUID(), title: `${c.name}: ${p.title}`, detail: p.detail, semester: Math.min(8, ctx.semester + 2), kind: 'PRACTICE', resources: [] });
  steps.sort((a, b) => a.semester - b.semester);
  return {
    title: `My ${GOAL_LABEL[goalTrack]} plan`,
    summary: base ? `Built from "${base.title}" and your target companies' requirements.` : 'Built from your target companies\' requirements.',
    gaps, steps,
  };
}

const aiRoadmapOut = z.object({
  title: z.string().max(120), summary: z.string().max(800),
  gaps: z.array(z.object({ skill: z.string(), why: z.string().max(300), priority: z.enum(['high', 'medium', 'low']) })).max(10),
  steps: z.array(z.object({ title: z.string().max(120), detail: z.string().max(600), semester: z.number().int().min(1).max(8),
    kind: z.enum(['SKILL', 'PROJECT', 'RESOURCE', 'PRACTICE']), resources: z.array(z.string().max(200)).max(5) })).min(4).max(16),
});

export async function aiRoadmap(ctx: Ctx, goalTrack: GoalTrack) {
  const user = [
    `Student: year ${ctx.user.currentYear}, department ${ctx.user.department}, current semester ${ctx.semester}.`,
    `Current skills: ${ctx.user.skills.join(', ') || 'none yet'}. Interests: ${ctx.user.interests.join(', ')}.`,
    `Goal: ${GOAL_LABEL[goalTrack]}${ctx.targetRole ? `, target role ${ctx.targetRole}` : ''}.`,
    `Target companies:\n${ctx.companies.map((c) => `- ${c.name}: skills tested ${c.skillsTested.join(', ')}; rounds ${(c.rounds as any[]).map((r) => r.name).join(' → ')}; experience topics ${[...new Set(c.experiences.flatMap((e) => (e.rounds as any[]).flatMap((r) => r.topics)))].slice(0, 15).join(', ')}`).join('\n') || 'none chosen'}`,
    `Alumni roadmaps:\n${ctx.roadmaps.map((r) => `- "${r.title}": ${(r.steps as any[]).map((s) => `S${s.semester} ${s.title}`).join('; ')}`).join('\n') || 'none'}`,
    `Alumni journeys (year: milestones):\n${ctx.twins.map((t) => `- ${Object.entries(t.milestonesByYear).map(([y, ms]) => `Y${y}: ${(ms as any[]).map((m) => m.title).join(', ')}`).join(' | ')}`).join('\n') || 'none'}`,
  ].join('\n\n');
  const out = await generateJSON({ system: ROADMAP_SYSTEM_PROMPT.replace('<current semester>', String(ctx.semester)), user, schema: aiRoadmapOut, maxTokens: 1800 });
  return { ...out, steps: out.steps.filter((s) => s.semester >= ctx.semester).map((s) => ({ ...s, id: randomUUID() })) };
}
```

`generateRoadmap(userId, input)` in `roadmaps.service.ts`: `ctx = gatherContext(…)` → try `aiRoadmap` (if `aiEnabled`), catch → `deterministicRoadmap` → mark steps whose title contains a skill the user already has as completed → in a transaction create `Roadmap` (`authorId = userId`, `isAi = <true only if AI succeeded>`, `isPublic = false`, `gaps`, `sources = { roadmaps, experiences, journeys }`) and a `RoadmapSave` with `completedSteps` → return `{ id, usedAI }`. **No points** for AI roadmaps (only human-written roadmaps earn points).

Route: `POST /roadmaps/generate` (`requireOnboarded`, `aiLimiter`, `roadmapGenerateSchema`: goalTrack, targetRole?, targetCompanySlugs? max 4).

### Step 5 — Placement dashboard (12 min)

`packages/shared/src/schemas/prep.ts`:

```ts
export const targetsSchema = z.object({ targetCompanies: z.array(z.string()).max(8), targetRoles: z.array(z.string().trim().toLowerCase()).max(5) });
export const prepItemSchema = z.object({ category: z.enum(['OA', 'APTITUDE', 'TECHNICAL', 'HR']), title: z.string().trim().min(3).max(140), companyId: z.string().uuid().optional() });
export const prepItemUpdateSchema = z.object({ done: z.boolean().optional(), title: z.string().trim().min(3).max(140).optional() });
```

`src/services/readiness.ts` — implement `TRD.md` §11.5:

```ts
export function readinessFor(user: { skills: string[] }, company: { id: string; skillsTested: string[] }, items: PrepItem[], simAvg?: number) {
  const tested = company.skillsTested;
  const skill = tested.length ? tested.filter((s) => user.skills.includes(s)).length / tested.length : 0;
  const tracks = (['OA', 'APTITUDE', 'TECHNICAL', 'HR'] as const).map((cat) => {
    const its = items.filter((i) => i.category === cat && (!i.companyId || i.companyId === company.id));
    return { category: cat, total: its.length, done: its.filter((i) => i.done).length };
  });
  const withItems = tracks.filter((t) => t.total > 0);
  const trackAvg = withItems.length ? withItems.reduce((s, t) => s + t.done / t.total, 0) / withItems.length : 0;
  let score = 100 * (0.6 * skill + 0.4 * trackAvg);
  if (simAvg != null) score += Math.min(10, simAvg / 10);
  return { score: Math.round(Math.min(100, score)), skill: Math.round(skill * 100), tracks };
}
```

`prep.service.getDashboard(userId)` returns:

| Field | How |
|---|---|
| `targets` | Companies in `user.targetCompanies` (name, slug, roles, visit month) + `targetRoles` |
| `readiness[]` | Per target company: `readinessFor(...)` + missing skills + latest sim score for that company |
| `tracks` | Overall progress per category (all items), each with its items (for the checklists) |
| `deadlines` | Events with category PLACEMENT or DEADLINE in the next 30 days for the user's year, plus opportunities with deadlines in 30 days the user bookmarked |
| `nextActions` | Up to 5 actions in the order from `TRD.md` §11.5, each `{ label, reason, href, kind }` |
| `recentSims` | Last 5 finished sessions: company, round, score/total, date |
| `stageCopy` | Year-adapted headline: Y1 "Focus on foundations — DSA basics, a first project and a club"; Y2 "Build projects and aim for an internship"; Y3–4 "Company-specific prep and practice"; Alumni "Help juniors prepare" |

Other prep endpoints:
- `PUT /me/targets` (`targetsSchema`) — validates slugs exist.
- `POST /prep/items`, `PATCH /prep/items/:id` (owner only), `DELETE /prep/items/:id`.
- `POST /prep/items/import { companyId }` — copies the company's `prepRoadmap` into `PrepItem`s (category from each step, `source = 'company'`), skipping titles the user already has.

### Step 6 — Simulator (17 min)

`packages/shared/src/schemas/sim.ts`:

```ts
export const simStartSchema = z.object({
  companySlug: z.string(),
  roundType: z.enum(['APTITUDE', 'CODING', 'CS_FUNDAMENTALS', 'TECHNICAL', 'HR']),
  maxQuestions: z.number().int().min(3).max(10).default(5),
});
export const simAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(4000),            // MCQ: option index as string
  selfCheck: z.array(z.number().int()).optional(),        // fallback grading: indices of rubric points the user met
});
```

`src/services/questionBank.ts` — a small hand-written **fallback bank** (5–8 questions per round type at mixed difficulty) so the simulator works without AI. MCQ for APTITUDE and CS_FUNDAMENTALS (`options`, `correctIndex`, `explanation`); SHORT for TECHNICAL and HR (`rubric`); CODING_APPROACH for CODING (`rubric`). Write original questions (e.g. "A train 120 m long passes a pole in 6 seconds. What is its speed in km/h?" — options and explanation).

`src/services/simulator.ts`:

```ts
/** Topics for this company + round from experiences, most recent first, with their source. */
export async function topicPool(companyId: string, roundType: SimRoundType) {
  const exps = await prisma.experience.findMany({ where: { companyId, isRemoved: false }, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], take: 20 });
  const pool: Array<{ topic: string; experienceId: string; year: number; role: string; difficulty: number }> = [];
  for (const e of exps) for (const r of e.rounds as any[]) if (r.type === roundType)
    for (const t of r.topics) pool.push({ topic: t, experienceId: e.id, year: e.year, role: e.role, difficulty: r.difficulty });
  return pool;
}

export function adaptDifficulty(s: { difficulty: number; correctStreak: number; wrongStreak: number }, correct: boolean) {
  let { difficulty, correctStreak, wrongStreak } = s;
  if (correct) { correctStreak++; wrongStreak = 0; } else { wrongStreak++; correctStreak = 0; }
  if (correctStreak >= 2) { difficulty = Math.min(5, difficulty + 1); correctStreak = 0; }
  if (wrongStreak >= 2) { difficulty = Math.max(1, difficulty - 1); wrongStreak = 0; }
  return { difficulty, correctStreak, wrongStreak };
}

const aiQuestionOut = z.object({
  format: z.enum(['MCQ', 'SHORT', 'CODING_APPROACH']), topic: z.string(), prompt: z.string().min(10).max(1500),
  options: z.array(z.string()).length(4).optional(), correctIndex: z.number().int().min(0).max(3).optional(),
  explanation: z.string().max(1200),
  rubric: z.array(z.object({ point: z.string().max(200), weight: z.number().min(1).max(5) })).min(3).max(6).optional(),
}).refine((q) => q.format !== 'MCQ' || (q.options && q.correctIndex != null), 'MCQ needs options and correctIndex')
  .refine((q) => q.format === 'MCQ' || q.rubric, 'Written questions need a rubric');

export async function generateQuestion(session: SimSession, company: Company, used: string[]) {
  const pool = await topicPool(company.id, session.roundType);
  // prefer unused topics close to the session difficulty
  const candidates = pool.filter((p) => !used.includes(p.topic)).sort((a, b) => Math.abs(a.difficulty - session.difficulty) - Math.abs(b.difficulty - session.difficulty));
  const source = candidates[0] ?? pool[0] ?? null;
  if (aiEnabled && source) {
    try {
      const q = await generateJSON({
        system: SIM_QUESTION_SYSTEM_PROMPT, // TRD §12.3
        user: `Company: ${company.name}. Round: ${session.roundType}. Difficulty: ${session.difficulty}/5.\nTopic reported by a senior: ${source.topic} (from a ${source.year} ${source.role} experience).\nOther topics reported for this round: ${[...new Set(pool.map((p) => p.topic))].slice(0, 10).join(', ')}.`,
        schema: aiQuestionOut, maxTokens: 900,
      });
      return { ...q, difficulty: session.difficulty, source };
    } catch { /* fall through to the bank */ }
  }
  const bankQ = pickFromBank(session.roundType, session.difficulty, used);
  return { ...bankQ, difficulty: session.difficulty, source }; // source may be null → UI says "General practice question"
}

const aiGradeOut = z.object({ scorePct: z.number().int().min(0).max(100), feedback: z.string().max(600), missing: z.array(z.string()).max(6) });

export async function gradeWritten(q: SimQuestion, answer: string, selfCheck?: number[]) {
  const rubric = (q.rubric as Array<{ point: string; weight: number }>) ?? [];
  if (aiEnabled) {
    try {
      return await generateJSON({
        system: SIM_GRADE_SYSTEM_PROMPT,
        user: `Question: ${q.prompt}\nRubric:\n${rubric.map((r, i) => `${i + 1}. ${r.point} (weight ${r.weight})`).join('\n')}\nStudent answer:\n${answer}`,
        schema: aiGradeOut, maxTokens: 500,
      });
    } catch { /* fall back to self-check */ }
  }
  const total = rubric.reduce((s, r) => s + r.weight, 0) || 1;
  const met = (selfCheck ?? []).reduce((s, i) => s + (rubric[i]?.weight ?? 0), 0);
  return { scorePct: Math.round((100 * met) / total), feedback: 'Self-assessed against the rubric.', missing: rubric.filter((_, i) => !selfCheck?.includes(i)).map((r) => r.point) };
}
```

`sim.service.ts`:

- `start(userId, input)`: company exists; create `SimSession` (`difficulty` 2, or 1 for first years); generate question 1; store as `SimQuestion` (`order 1`, `sourceExperienceId/Year/Role` from `source`, `correctAnswer` = `String(correctIndex)` for MCQ); return the session + the question **without** `correctAnswer`, `explanation` or `rubric` weights (rubric points can be shown only after answering, except in self-check mode where the UI needs them — send rubric points but not until the user submits their text answer; simplest: return the rubric only in the answer response).
- `answer(userId, sessionId, input)`: owner + ACTIVE checks; question belongs to the session and is unanswered; grade (MCQ: compare index; written: `gradeWritten`); `isCorrect` = MCQ match or `scorePct ≥ 70`; update question (`userAnswer`, `isCorrect`, `scorePct`, `feedback`, `answeredAt`); update session (`score += isCorrect ? 1 : 0`, `total++`, `adaptDifficulty`); if `total < maxQuestions` generate and store the next question (avoid used topics); return `{ graded: {isCorrect, scorePct, feedback, explanation, correctAnswer, rubric, missing}, next?: question, done: boolean }`.
- `finish(userId, sessionId)`: set FINISHED; compute summary — accuracy by topic, `revise` = topics with < 60%, `strengths` = topics ≥ 80%, `experienceIds` = distinct sources; store in `summary`; return it with links.
- `get(userId, sessionId)`: session with questions; hide `correctAnswer`/`explanation` for unanswered ones.

Routes: `POST /sim/sessions` (aiLimiter), `GET /sim/sessions/:id`, `POST /sim/sessions/:id/answer` (aiLimiter), `POST /sim/sessions/:id/finish`, and `GET /sim/sessions?limit=5` (recent, for the dashboard).

> **Coding rounds:** there is no code execution. The student explains the approach, data structures and complexity; grading uses the rubric. Say this clearly in the UI ("Explain your approach — code execution is coming later").

---

## 5. Step-by-step — Web

### Step 7 — AI answer panel and summaries (10 min)

**`AiAnswerPanel`** (`questionId?` or `title/body`):
- Collapsed state: a tinted indigo card with a sparkles icon — on `/ask/new`: "Get an instant answer from seniors' past answers" button (shown when the similar-questions panel found matches); on `/ask/:id`: "Show AI summary of senior answers" (collapsed by default, above the answers).
- Loading: 3 skeleton lines + rotating status text ("Reading seniors' answers…", "Writing a short summary…").
- `ok`: answer text where `[1]`, `[2]` render as small numbered pills linking to `/ask/{questionId}`; below, "Sources" list (number, question title, author role badge, "Best answer" tag); footer note "AI-generated from seniors' answers — check the sources."; thumbs up/down (local only, optional).
- `fallback`: title "Related answers from seniors" + the sources list with answer excerpts (no AI text).
- `no_sources`: "No senior has answered this yet. Posting will notify seniors who know this topic." + "Post your question" button.
- Errors (429): "You've used AI a lot this hour — the sources below still help." and show sources if available.

**`AiSummaryCard`**:
- On post pages with ≥ 8 comments: button "Summarise this discussion" → bullets with citation pills pointing to comment anchors (`#c-{id}`).
- On company Overview: "What seniors say about {company}" — loads automatically (cached), shows bullets; label "AI summary" or "Summary" (fallback, deterministic).

### Step 8 — Roadmap generator page (10 min)

**`/roadmaps/generate`** (also linked from company pages, Path Twins and the dashboard with query params `track`, `company`):
- Header: "Generate my roadmap" / "Built from alumni roadmaps, journeys and the companies you're targeting."
- Form card: goal track picker (cards), target role (`Select` from `TARGET_ROLES`, optional), target companies (multi-select, max 4, prefilled from profile/query), button **Generate my plan**.
- Loading: a stepped progress list that ticks through "Looking at alumni roadmaps", "Checking your target companies", "Comparing with your skills", "Writing your plan" (purely visual, ~1 s each, ends when the request resolves).
- On success → navigate to `/roadmaps/:id`.

**Roadmap detail additions (from Phase 06):** for AI/personal roadmaps show
- a badge: "AI · built from 3 alumni roadmaps, 9 experiences and 3 journeys" (or "Personal plan · built from …" when `isAi = false` fallback);
- **`GapsCard`** above the steps: "Skills to build first" — rows with skill, priority pill (High rose-soft, Medium amber-soft, Low grey) **with text**, and the "why"; each gap links to related resources (search `/search?q={skill}`);
- step kinds visible (Skill / Project / Resource / Practice icons) so skills are clearly mapped to projects, resources and practice tasks.

### Step 9 — Placement dashboard (12 min)

**`/prep`** — `PageHeader` "My Prep" with `stageCopy` as the description; action buttons **Start a simulation** and **Generate my roadmap**.

Layout (desktop: 3-column grid; mobile: stacked):

1. **`TargetsCard`** — chips of target companies (logo initial + name) with remove ×, "Add company" select, target roles chips; saving calls `PUT /me/targets`. Empty: "Pick 1–3 target companies to see your readiness."
2. **`ReadinessCard`** per target company — a radial gauge or large `MatchRing`-style ring (score 0–100), company name and visit month, "Skills: 4/7 · Prep: 38%", missing skills chips (max 4) with "+ Add to roadmap", latest sim score pill, links "View company" and "Practice". Use **Recharts** `RadialBarChart` or a custom SVG ring; label the number in the centre and include `aria-label`.
3. **Prep tracks** — 4 `PrepTrack` cards in a 2×2 grid: **Online assessment · Aptitude · Technical interview · HR interview**, each with icon, progress bar ("5 of 12"), checklist of items (checkbox, title, company tag, delete on hover), "Add item" inline input, and "Import from {company}" button (calls `/prep/items/import`). Checkbox toggles are optimistic.
4. **`NextActions`** — numbered list (max 5) with icons and short reasons ("Learn SQL — tested by 2 of your targets"), each a link.
5. **`DeadlinesCard`** — upcoming placement events and bookmarked opportunity deadlines with countdown badges.
6. **`RecentSims`** — last 5 sessions with company, round, score ("4/5"), date, and "Review" link; plus a tiny Recharts line/bar of scores over time if ≥ 3 sessions.

### Step 10 — Simulator (13 min)

**`/prep/simulator`** (setup):
- Header: "Practice simulator" / "Questions based on what seniors faced in real campus processes."
- Step 1: company picker (cards for targets first, then all companies) showing "Based on 9 experiences".
- Step 2: round type cards (Aptitude · Coding (approach) · CS fundamentals · Technical interview · HR interview) — disable types with no experience topics for that company, with a hint "No seniors reported this round yet — try general practice" (still allowed; uses the bank).
- Step 3: number of questions (3 / 5 / 10), and a note: "Questions are original, written on topics seniors reported. We never show confidential questions."
- **Start** → `POST /sim/sessions` → navigate to `/prep/simulator/:id`.

**`/prep/simulator/:id`** (session):
- Top bar: company + round, progress "Question 2 of 5", a difficulty indicator (5 small bars, filled to the current level, label "Difficulty adapts to your answers"), and **End session**.
- **`QuestionView`**:
  - Source line under the prompt: "Based on a 2025 Software Engineer experience" (or "General practice question" when no source).
  - MCQ: 4 large option buttons (A–D); select then **Submit**.
  - SHORT / CODING_APPROACH: textarea (min height 160px) with placeholder ("Explain your approach, data structures and time complexity" for coding); **Submit**. If AI is off, after submit show the rubric checklist and ask "Which points did you cover?" → submit self-check.
- **`FeedbackView`** (after submit): correct/incorrect banner (emerald/rose) or score ring for written answers; explanation; rubric with ✓/✗ per point; "What to revise" list from `missing`; link to the source experience; **Next question** (or **See summary** on the last).
- **`SessionSummary`** (after finish): score ring ("4/5"), accuracy by topic as horizontal bars (Recharts `BarChart`, labelled), "Strengths" and "Revise these" chip lists, links to source experiences, buttons **Practice again** (same settings), **Add revision topics to my prep** (creates prep items in the matching category), **Back to dashboard**.
- Keyboard: 1–4 select options, Enter submits.

Commit:

```bash
git add -A && git commit -m "phase-09: ai answers, summaries, roadmap generator, prep dashboard, simulator" && git tag phase-09
```

---

## 6. UI quality checklist

- [ ] AI output is always labelled and always shows its sources; citation pills are clickable.
- [ ] Loading states feel alive (status text, skeleton lines), never a frozen button.
- [ ] Errors degrade gracefully to the non-AI version with calm wording.
- [ ] Priority and correctness use colour **and** text/icons (accessible).
- [ ] Dashboard reads at a glance: rings, progress bars and a clear "what next" list.
- [ ] Simulator feels like a focused exam mode: minimal chrome, big options, clear progress, encouraging feedback.
- [ ] Charts have labels, legible axis text in both themes, and `aria-label`s.

---

## 7. Completion criteria

- [ ] With the API key: answers cite only real sources (invalid citation numbers removed); summaries return ≤ 5 bullets; roadmaps validate and save; simulator generates, grades and adapts.
- [ ] **With `ANTHROPIC_API_KEY` unset:** answer panel shows sources; company summary shows deterministic bullets; roadmap uses the deterministic builder; simulator uses the question bank with self-check grading. Nothing crashes.
- [ ] AI key never appears in the web bundle (search `apps/web/dist` for part of the key: no match).
- [ ] Rate limit returns a friendly 429 after 20 AI calls in an hour.
- [ ] Dashboard: targets save; readiness changes when skills or prep items change; four tracks are separate; next actions make sense for year 1 vs year 3.
- [ ] Simulator: every question shows its source year and role (or "General practice"); difficulty goes up after 2 correct and down after 2 wrong; summary lists topics to revise.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 9.1 | On `/ask/new` type a title similar to a seeded answered question → "Get an instant answer" | Panel with an answer and [1][2] pills linking to real questions |
| 9.2 | Type a question on a topic nobody answered | "No senior has answered this yet…" |
| 9.3 | Open a question page → "Show AI summary" | Cited answer appears (or sources-only in fallback) |
| 9.4 | Company Overview | "What seniors say about …" bullets (AI or deterministic) |
| 9.5 | Generate a roadmap: Product, 2 target companies | Private roadmap with badge, gaps card (e.g. "DSA — High — tested by 2 of your targets"), steps from the current semester with kinds |
| 9.6 | As another user open `/roadmaps` | Ananya's personal roadmap is not listed |
| 9.7 | `/prep` as Ananya with 2 targets | Two readiness cards; four separate tracks; next actions start with foundations (year 1 copy) |
| 9.8 | Import prep items from a company, tick 3 | Track progress and readiness increase |
| 9.9 | Start a 5-question Aptitude simulation | Each question shows its source year/role; answering 2 correctly raises the difficulty indicator |
| 9.10 | Answer 2 wrong in a row | Difficulty decreases |
| 9.11 | Technical round, write a short answer | Score ring, rubric ✓/✗ and feedback |
| 9.12 | Finish → "Add revision topics to my prep" | Items appear in the matching prep track |
| 9.13 | Remove `ANTHROPIC_API_KEY`, restart, repeat 9.1, 9.5, 9.9, 9.11 | Fallbacks work; written answers use self-check |
| 9.14 | Call `POST /api/ai/answer` 21 times | 21st returns 429 with a friendly message |
| 9.15 | Signed out, `POST /api/sim/sessions` | 401 |
| 9.16 | Mobile 375px dashboard and simulator | Cards stack; options are large tap targets; charts fit |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `JSON.parse` fails on AI output | Keep the "JSON only" instruction, strip code fences (done in `generateJSON`), lower temperature if your SDK allows, and rely on the fallback |
| zod rejects AI output often | Loosen max lengths slightly; log the raw text in development to see what's wrong |
| Answers cite numbers that don't exist | Already filtered; make sure the UI uses the filtered `citations` |
| Simulator repeats topics | Pass used topics; when the pool is exhausted, allow repeats at a different difficulty |
| Readiness always 0 | Target companies must be slugs that exist; skills must be lowercase like `skillsTested` |
| Slow AI calls during the demo | Pre-warm: open the key screens once before presenting (answers and summaries are cached) |

---

## 10. If you're behind (in this order)

1. Skip thread summaries (keep the company summary — deterministic version is enough).
2. Simulator: MCQ rounds only (Aptitude, CS fundamentals) from the question bank + AI generation; skip written-answer grading.
3. Skip the dashboard's recent-sims chart and deadlines card.
4. Roadmap generator: deterministic builder only (keep gaps + steps; label it "Personal plan built from alumni roadmaps").
5. AI answer panel: sources-only mode.

**Keep at minimum:** placement dashboard with four prep tracks and readiness, the roadmap generator (deterministic is fine), and at least the MCQ simulator — these cover every line of your "Placement Intelligence" section.
