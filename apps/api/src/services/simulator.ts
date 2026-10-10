import { pickFromBank } from './questionBank';

export function adaptDifficulty(s: { difficulty: number; correctStreak: number; wrongStreak: number }, correct: boolean) {
  let { difficulty, correctStreak, wrongStreak } = s;
  if (correct) { correctStreak++; wrongStreak = 0; } else { wrongStreak++; correctStreak = 0; }
  if (correctStreak >= 2) { difficulty = Math.min(5, difficulty + 1); correctStreak = 0; }
  if (wrongStreak >= 2) { difficulty = Math.max(1, difficulty - 1); wrongStreak = 0; }
  return { difficulty, correctStreak, wrongStreak };
}

export async function generateQuestion(session: any, company: any, used: string[]) {
  const bankQ = pickFromBank(session.roundType, session.difficulty, used);
  return { ...bankQ, difficulty: session.difficulty, source: null };
}

export async function gradeWritten(q: any, answer: string, selfCheck?: number[]) {
  const rubric = (q.rubric as Array<{ point: string; weight: number }>) ?? [];
  const total = rubric.reduce((s, r) => s + r.weight, 0) || 1;
  const met = (selfCheck ?? []).reduce((s, i) => s + (rubric[i]?.weight ?? 0), 0);
  return { scorePct: Math.round((100 * met) / total), feedback: 'Self-assessed.', missing: rubric.filter((_, i) => !selfCheck?.includes(i)).map((r) => r.point) };
}
