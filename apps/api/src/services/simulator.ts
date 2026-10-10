import { prisma } from '../lib/prisma';
import { env, aiEnabled } from '../config/env';
import { generateJSON } from '../lib/ai';
import { aiQuestionOut, aiGradeOut } from '@crossroads/shared';
import { pickFromBank } from './questionBank';

export async function topicPool(companyId: string, roundType: string) {
  const exps = await prisma.experience.findMany({
    where: { companyId, isRemoved: false },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  });

  const pool: Array<{ topic: string; experienceId: string; year: number; role: string; difficulty: number }> = [];
  for (const e of exps) {
    for (const r of e.rounds as any[]) {
      if (r.type === roundType) {
        for (const t of (r.topics as string[]) ?? []) {
          pool.push({ topic: t, experienceId: e.id, year: e.year, role: e.role, difficulty: r.difficulty ?? 3 });
        }
      }
    }
  }
  return pool;
}

export function adaptDifficulty(s: { difficulty: number; correctStreak: number; wrongStreak: number }, correct: boolean) {
  let { difficulty, correctStreak, wrongStreak } = s;
  if (correct) { correctStreak++; wrongStreak = 0; } else { wrongStreak++; correctStreak = 0; }
  if (correctStreak >= 2) { difficulty = Math.min(5, difficulty + 1); correctStreak = 0; }
  if (wrongStreak >= 2) { difficulty = Math.max(1, difficulty - 1); wrongStreak = 0; }
  return { difficulty, correctStreak, wrongStreak };
}

const SIM_QUESTION_SYSTEM_PROMPT = `You are a campus placement question writer. Given a topic reported by a senior, write an ORIGINAL practice question at the given difficulty level. NEVER reproduce a real exam question verbatim. Return only valid JSON matching the schema.`;

export async function generateQuestion(session: { roundType: string; difficulty: number }, company: { id: string; name: string }, used: string[]) {
  const pool = await topicPool(company.id, session.roundType);
  const unused = pool.filter((p) => !used.includes(p.topic));
  const source = unused.length > 0
    ? unused.sort((a, b) => Math.abs(a.difficulty - session.difficulty) - Math.abs(b.difficulty - session.difficulty))[0]
    : pool.length > 0 ? pool[0] : null;

  if (aiEnabled && source) {
    try {
      const q = await generateJSON({
        system: SIM_QUESTION_SYSTEM_PROMPT,
        user: `Company: ${company.name}. Round: ${session.roundType}. Difficulty: ${session.difficulty}/5.\nTopic reported by a senior: ${source.topic} (from a ${source.year} ${source.role} experience).\nOther topics reported for this round: ${[...new Set(pool.map((p) => p.topic))].slice(0, 10).join(', ')}.`,
        schema: aiQuestionOut,
        maxTokens: 900,
      });
      return { ...q, difficulty: session.difficulty, source };
    } catch {
      // fall through to question bank
    }
  }

  const bankQ = pickFromBank(session.roundType, session.difficulty, used);
  return { ...bankQ, difficulty: session.difficulty, source };
}

const SIM_GRADE_SYSTEM_PROMPT = `You are a fair campus placement interviewer grading a student's answer. Score from 0–100 based on the rubric. Be concise and constructive. Return only valid JSON.`;

export async function gradeWritten(q: { prompt: string; rubric: unknown }, answer: string, selfCheck?: number[]) {
  const rubric = (q.rubric as Array<{ point: string; weight: number }>) ?? [];
  if (aiEnabled) {
    try {
      return await generateJSON({
        system: SIM_GRADE_SYSTEM_PROMPT,
        user: `Question: ${q.prompt}\nRubric:\n${rubric.map((r, i) => `${i + 1}. ${r.point} (weight ${r.weight})`).join('\n')}\nStudent answer:\n${answer}`,
        schema: aiGradeOut,
        maxTokens: 500,
      });
    } catch {
      // fall back to self-check
    }
  }
  const total = rubric.reduce((s, r) => s + r.weight, 0) || 1;
  const met = (selfCheck ?? []).reduce((s, i) => s + (rubric[i]?.weight ?? 0), 0);
  return {
    scorePct: Math.round((100 * met) / total),
    feedback: 'Self-assessed against the rubric.',
    missing: rubric.filter((_, i) => !(selfCheck ?? []).includes(i)).map((r) => r.point),
  };
}
