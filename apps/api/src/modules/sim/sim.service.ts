import { prisma } from '../../lib/prisma';
import { generateQuestion, adaptDifficulty, gradeWritten } from '../../services/simulator';
import { AppError } from '../../lib/errors';

export async function start(userId: string, input: any) {
  const c = await prisma.company.findUniqueOrThrow({ where: { slug: input.companySlug } });
  const s = await prisma.simSession.create({
    data: { userId, companyId: c.id, roundType: input.roundType, maxQuestions: input.maxQuestions, difficulty: 2 }
  });
  const q = await generateQuestion(s, c, []);
  const question = await prisma.simQuestion.create({
    data: { sessionId: s.id, order: 1, format: q.format as any, prompt: q.prompt, topic: q.topic, options: q.options, correctAnswer: String(q.correctIndex), explanation: q.explanation, difficulty: q.difficulty }
  });
  return { session: s, question: { ...question, correctAnswer: undefined, explanation: undefined } };
}
