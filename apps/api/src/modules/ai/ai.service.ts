import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { cached } from '../../lib/cache';
import { generateJSON } from '../../lib/ai';
import { getRelatedAnswers } from '../../services/retrieval';
import { aiAnswerOut, aiSummaryOut } from '@bridgeup/shared';
import { env } from '../../config/env';

const ANSWER_SYSTEM_PROMPT = `You are a helpful campus assistant. Answer the user's question using ONLY the provided sources. Use citation format [n] for facts. Keep it short.`;
const ROLE_LABELS: Record<string, string> = { SENIOR: 'Senior', ALUMNI: 'Alumni', STUDENT: 'Student' };

export async function answer(viewerId: string, input: { questionId?: string; title?: string; body?: string }) {
  let title = input.title ?? '', body = input.body ?? '', exclude: string | undefined;
  if (input.questionId) {
    const p = await prisma.post.findFirst({ where: { id: input.questionId, kind: 'QUESTION', isRemoved: false } });
    if (!p) throw new AppError(404, 'NOT_FOUND', 'Question not found');
    title = p.title; body = p.body; exclude = p.id;
  }
  const sources = await getRelatedAnswers(title, body, exclude);
  if (!sources.length) return { status: 'no_sources' as const, sources: [] };
  if (!env.AI_API_KEY) return { status: 'fallback' as const, sources };

  const key = `answer:${input.questionId ?? title.toLowerCase()}`;
  try {
    const out = await cached(key, 60 * 60_000, () =>
      generateJSON({
        system: ANSWER_SYSTEM_PROMPT,
        user: `Question: ${title}\nDetails: ${body || 'none'}\nSources:\n` +
          sources.map((s: any) => `[${s.n}] (${ROLE_LABELS[s.author.role] || 'Student'}, ${s.author.department ?? ''}) ${s.answer}`).join('\n'),
        schema: aiAnswerOut,
        maxTokens: 600,
      }));
    const valid = out.citations.filter((c: any) => sources.some((s: any) => s.n === c));
    return { status: 'ok' as const, answer: out.answer, citations: valid, sources };
  } catch (e) {
    return { status: 'fallback' as const, sources };
  }
}

export async function summary(viewerId: string, input: { postId?: string; companySlug?: string }) {
  if (input.companySlug) {
    const c = await prisma.company.findUnique({ where: { slug: input.companySlug }, include: { experiences: { take: 15, orderBy: { year: 'desc' } } } });
    if (!c) throw new AppError(404, 'NOT_FOUND', 'Company not found');
    return { status: 'fallback' as const, bullets: [
      `Most common topics: ${[...new Set(c.experiences.flatMap((e: any) => (e.rounds as any[]).flatMap((r: any) => r.topics)))].slice(0, 3).join(', ')}`,
      `From ${c.experiences.length} experiences`
    ] };
  }
  return { status: 'fallback' as const, bullets: [] };
}
