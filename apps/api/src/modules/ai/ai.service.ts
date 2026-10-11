import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { cached } from '../../lib/cache';
import { generateJSON, AIError } from '../../lib/ai';
import { logger } from '../../lib/logger';
import { getRelatedAnswers } from '../../services/retrieval';
import { aiAnswerOut, aiSummaryOut, aiPeopleFilterOut, SKILLS, INTERESTS, TARGET_ROLES, DEPARTMENTS } from '@crossroads/shared';
import { env, aiEnabled } from '../../config/env';

const ANSWER_SYSTEM_PROMPT = `You are a helpful campus assistant. Answer the student's question using ONLY the provided sources from seniors. Use citation format [n] to reference sources. Keep the answer under 300 words. Return only valid JSON with exactly two keys: "answer" (string) and "citations" (array of source numbers, empty if none).`;

const SUMMARY_SYSTEM_PROMPT = `You are a helpful campus assistant. Summarise the thread or experiences in 3–5 concise bullet points using ONLY the provided content. Use citation format [n] to reference specific items. Return only valid JSON.`;

const ROLE_LABELS: Record<string, string> = { SENIOR: 'Senior', ALUMNI: 'Alumni', STUDENT: 'Student', ADMIN: 'Admin' };

export async function answer(viewerId: string, input: { questionId?: string; title?: string; body?: string }) {
  let title = input.title ?? '';
  let body = input.body ?? '';
  let exclude: string | undefined;

  if (input.questionId) {
    const p = await prisma.post.findFirst({ where: { id: input.questionId, kind: 'QUESTION', isRemoved: false } });
    if (!p) throw new AppError(404, 'NOT_FOUND', 'Question not found');
    title = p.title;
    body = p.body;
    exclude = p.id;
  }

  const sources = await getRelatedAnswers(title, body, exclude);
  if (!sources.length) return { status: 'no_sources' as const, sources: [] };
  if (!aiEnabled) return { status: 'fallback' as const, sources };

  const key = `answer:${input.questionId ?? title.toLowerCase().slice(0, 80)}`;
  try {
    const out = await cached(key, 60 * 60_000, () =>
      generateJSON({
        system: ANSWER_SYSTEM_PROMPT,
        user:
          `Question: ${title}\nDetails: ${body || 'none'}\nSources:\n` +
          sources
            .map((s: any) => `[${s.n}] (${ROLE_LABELS[s.author.role] ?? 'Student'}, ${s.author.department ?? ''}) ${s.answer}`)
            .join('\n'),
        schema: aiAnswerOut,
        maxTokens: 600,
      }),
    );
    const valid = out.citations.filter((c: number) => sources.some((s: any) => s.n === c));
    return { status: 'ok' as const, answer: out.answer, citations: valid, sources };
  } catch (err) {
    logger.warn({ err }, 'AI call failed, serving the non-AI fallback');
    return { status: 'fallback' as const, sources };
  }
}

function deterministicCompanySummary(company: any, experiences: any[]) {
  const allTopics = experiences.flatMap((e: any) =>
    (e.rounds as any[]).flatMap((r: any) => (r.topics as string[]) ?? []),
  );
  const topicCounts = new Map<string, number>();
  for (const t of allTopics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  const diffs = experiences
    .flatMap((e: any) => (e.rounds as any[]).map((r: any) => r.difficulty as number))
    .filter(Boolean);
  const avgDiff = diffs.length ? (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1) : null;

  const roundNames = [
    ...new Set(experiences.flatMap((e: any) => (e.rounds as any[]).map((r: any) => r.name as string)).filter(Boolean)),
  ].slice(0, 5);

  const bullets = [
    topTopics.length ? `Most common topics: ${topTopics.join(', ')}` : `Based on ${experiences.length} interview experiences`,
    `From ${experiences.length} experience${experiences.length !== 1 ? 's' : ''}`,
    avgDiff ? `Average difficulty ${avgDiff}/5` : null,
    roundNames.length ? `Typical rounds: ${roundNames.join(' → ')}` : null,
  ].filter(Boolean) as string[];

  return bullets;
}

export async function summary(viewerId: string, input: { postId?: string; companySlug?: string }) {
  if (input.companySlug) {
    const company = await prisma.company.findUnique({
      where: { slug: input.companySlug },
      include: { experiences: { where: { isRemoved: false }, orderBy: { year: 'desc' }, take: 15 } },
    });
    if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

    const expCount = company.experiences.length;
    const deterministicBullets = deterministicCompanySummary(company, company.experiences);

    if (!aiEnabled || expCount < 3) {
      return { status: 'deterministic' as const, bullets: deterministicBullets, expCount };
    }

    const key = `summary:company:${company.slug}:${expCount}`;
    try {
      const out = await cached(key, 24 * 60 * 60_000, () => {
        const numbered = company.experiences.map((e: any, i: number) => {
          const rounds = (e.rounds as any[]).map((r: any) => `${r.name ?? r.type}: topics [${(r.topics ?? []).join(', ')}], difficulty ${r.difficulty}/5`).join('; ');
          return `[${i + 1}] ${e.year} ${e.role}: ${rounds}. Tips: ${e.tips || 'none'}`;
        });
        return generateJSON({
          system: SUMMARY_SYSTEM_PROMPT,
          user: `Summarise these ${company.name} interview experiences:\n${numbered.join('\n')}`,
          schema: aiSummaryOut,
          maxTokens: 400,
        });
      });
      return { status: 'ok' as const, bullets: out.bullets, citations: out.citations, expCount };
    } catch (err) {
      logger.warn({ err }, 'AI call failed, serving the non-AI fallback');
      return { status: 'deterministic' as const, bullets: deterministicBullets, expCount };
    }
  }

  if (input.postId) {
    const post = await prisma.post.findUnique({
      where: { id: input.postId },
      include: {
        comments: {
          where: { isRemoved: false },
          orderBy: { score: 'desc' },
          take: 30,
          select: { id: true, body: true, score: true, createdAt: true },
        },
      },
    });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    const commentCount = post.comments.length;
    if (commentCount < 8) {
      throw new AppError(400, 'VALIDATION', 'This thread is short enough to read');
    }

    if (!aiEnabled) return { status: 'fallback' as const };

    const key = `summary:thread:${input.postId}:${commentCount}`;
    try {
      const out = await cached(key, 60 * 60_000, () => {
        const numbered = post.comments.map((c, i) => `[${i + 1}] ${c.body.slice(0, 400)}`);
        return generateJSON({
          system: SUMMARY_SYSTEM_PROMPT,
          user: `Thread: "${post.title}"\n\nComments:\n${numbered.join('\n')}`,
          schema: aiSummaryOut,
          maxTokens: 400,
        });
      });
      return { status: 'ok' as const, bullets: out.bullets, citations: out.citations };
    } catch (err) {
      logger.warn({ err }, 'AI call failed, serving the non-AI fallback');
      return { status: 'fallback' as const };
    }
  }

  throw new AppError(400, 'VALIDATION', 'Provide postId or companySlug');
}

const PEOPLE_SEARCH_SYSTEM_PROMPT = `You are a search query parser for a college mentorship platform. Convert the user's free-text description of who they're looking for into structured filters.
Only use values from these vocabularies (lowercase, exact strings), or omit the field if nothing fits:
- role: one of STUDENT, SENIOR, ALUMNI (SENIOR = current final-year/penultimate student, ALUMNI = graduated)
- department: one of ${DEPARTMENTS.join(', ')}
- skills: up to 6 values from [${SKILLS.join(', ')}]
- interests: up to 6 values from [${INTERESTS.join(', ')}]
- targetRole: one of [${TARGET_ROLES.join(', ')}]
- company: a free-text company name if one is mentioned (e.g. "Northwind Labs"), else omit
- mentorAvailable: true only if the user is explicitly looking for a mentor or someone willing to help/guide them
- summary: a short (<=15 words) human-readable restatement of what you understood, e.g. "Alumni mentors in machine learning at product companies"
Return only valid JSON matching this shape exactly. Never invent a skill, interest or role that is not in the vocabulary above.`;

const mentions = (haystack: string, term: string) => haystack.includes(term.toLowerCase());

/** Deterministic keyword-match fallback used when AI is disabled or the call fails — same filters, no model required. */
function deterministicPeopleFilters(query: string): z.infer<typeof aiPeopleFilterOut> {
  const q = query.toLowerCase();
  const skills = SKILLS.filter((s) => mentions(q, s)).slice(0, 6);
  const interests = INTERESTS.filter((i) => mentions(q, i)).slice(0, 6);
  const targetRole = TARGET_ROLES.find((r) => mentions(q, r));
  const department = DEPARTMENTS.find((d) => mentions(q, d.toLowerCase()));
  let role: 'STUDENT' | 'SENIOR' | 'ALUMNI' | undefined;
  if (mentions(q, 'alumni') || mentions(q, 'alumnus') || mentions(q, 'graduate')) role = 'ALUMNI';
  else if (mentions(q, 'senior')) role = 'SENIOR';
  else if (mentions(q, 'junior') || mentions(q, 'student') || mentions(q, 'first year') || mentions(q, 'fresher')) role = 'STUDENT';
  const mentorAvailable = mentions(q, 'mentor') || mentions(q, 'guide') || mentions(q, 'help me');

  return {
    role,
    department,
    skills,
    interests,
    targetRole,
    mentorAvailable,
    summary: `Keyword match for "${query.slice(0, 60)}"`,
  };
}

/** Validate the model's output against our canonical vocabularies so a hallucinated value never reaches the DB query. */
function sanitizePeopleFilters(out: z.infer<typeof aiPeopleFilterOut>): z.infer<typeof aiPeopleFilterOut> {
  const lc = (s: string) => s.toLowerCase();
  return {
    ...out,
    skills: out.skills.filter((s) => (SKILLS as readonly string[]).includes(lc(s))).map(lc),
    interests: out.interests.filter((i) => (INTERESTS as readonly string[]).includes(lc(i))).map(lc),
    targetRole: out.targetRole && (TARGET_ROLES as readonly string[]).includes(lc(out.targetRole)) ? lc(out.targetRole) : undefined,
    department: out.department && (DEPARTMENTS as readonly string[]).includes(out.department) ? out.department : undefined,
  };
}

export async function parsePeopleQuery(query: string): Promise<{ filters: z.infer<typeof aiPeopleFilterOut>; usedAI: boolean }> {
  if (!aiEnabled) return { filters: deterministicPeopleFilters(query), usedAI: false };

  try {
    const out = await cached(`people-query:${query.toLowerCase().trim()}`, 60 * 60_000, () =>
      generateJSON({
        system: PEOPLE_SEARCH_SYSTEM_PROMPT,
        user: `Find: ${query}`,
        schema: aiPeopleFilterOut,
        maxTokens: 300,
      }),
    );
    return { filters: sanitizePeopleFilters(out), usedAI: true };
  } catch (err) {
    if (!(err instanceof AIError)) logger.warn({ err }, 'unexpected error parsing AI people query');
    else logger.warn({ err }, 'AI call failed, serving the deterministic keyword fallback');
    return { filters: deterministicPeopleFilters(query), usedAI: false };
  }
}
