import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { generateQuestion, adaptDifficulty, gradeWritten } from '../../services/simulator';

function safeQuestion(q: any, reveal: boolean) {
  const base = {
    id: q.id,
    order: q.order,
    format: q.format,
    topic: q.topic,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    sourceYear: q.sourceYear,
    sourceRole: q.sourceRole,
    userAnswer: q.userAnswer,
    isCorrect: q.isCorrect,
    scorePct: q.scorePct,
    feedback: q.feedback,
    answeredAt: q.answeredAt,
  };
  if (reveal) return { ...base, correctAnswer: q.correctAnswer, explanation: q.explanation, rubric: q.rubric };
  // For unanswered SHORT/CODING_APPROACH questions, include rubric points (so UI can show self-check after answer)
  // but not correctAnswer or explanation
  if (q.format !== 'MCQ' && !q.answeredAt) return { ...base, rubric: q.rubric };
  return base;
}

export async function start(userId: string, input: { companySlug: string; roundType: string; maxQuestions: number }) {
  const company = await prisma.company.findUnique({ where: { slug: input.companySlug } });
  if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

  const session = await prisma.simSession.create({
    data: { userId, companyId: company.id, roundType: input.roundType as any, maxQuestions: input.maxQuestions, difficulty: 2 },
  });

  const q = await generateQuestion(session as any, company as any, []);
  const question = await prisma.simQuestion.create({
    data: {
      sessionId: session.id,
      order: 1,
      format: q.format as any,
      prompt: q.prompt,
      topic: q.topic,
      difficulty: q.difficulty,
      options: q.options ?? [],
      correctAnswer: q.correctIndex != null ? String(q.correctIndex) : null,
      explanation: q.explanation,
      rubric: (q.rubric as any) ?? [],
      sourceExperienceId: (q.source as any)?.experienceId ?? null,
      sourceYear: (q.source as any)?.year ?? null,
      sourceRole: (q.source as any)?.role ?? null,
    },
  });

  return { session, question: safeQuestion(question, false) };
}

export async function answerQuestion(userId: string, sessionId: string, input: { questionId: string; answer: string; selfCheck?: number[] }) {
  const session = await prisma.simSession.findUnique({ where: { id: sessionId }, include: { company: true } });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Session not found');
  if (session.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your session');
  if (session.status !== 'ACTIVE') throw new AppError(400, 'CONFLICT', 'Session is not active');

  const q = await prisma.simQuestion.findUnique({ where: { id: input.questionId } });
  if (!q || q.sessionId !== sessionId) throw new AppError(404, 'NOT_FOUND', 'Question not found');
  if (q.answeredAt) throw new AppError(400, 'CONFLICT', 'Question already answered');

  let isCorrect = false;
  let scorePct = 0;
  let feedback = '';
  let missing: string[] = [];

  if (q.format === 'MCQ') {
    isCorrect = String(input.answer) === q.correctAnswer;
    scorePct = isCorrect ? 100 : 0;
    feedback = isCorrect ? 'Correct!' : `Correct answer: option ${Number(q.correctAnswer) + 1}.`;
  } else {
    const grade = await gradeWritten(q, input.answer, input.selfCheck);
    scorePct = grade.scorePct;
    isCorrect = scorePct >= 70;
    feedback = grade.feedback;
    missing = grade.missing;
  }

  const now = new Date();
  await prisma.simQuestion.update({
    where: { id: q.id },
    data: { userAnswer: input.answer, isCorrect, scorePct, feedback, answeredAt: now },
  });

  const newTotal = session.total + 1;
  const newScore = session.score + (isCorrect ? 1 : 0);
  const newStreaks = adaptDifficulty(
    { difficulty: session.difficulty, correctStreak: session.correctStreak, wrongStreak: session.wrongStreak },
    isCorrect,
  );

  await prisma.simSession.update({
    where: { id: sessionId },
    data: { score: newScore, total: newTotal, ...newStreaks },
  });

  const done = newTotal >= session.maxQuestions;
  let next: ReturnType<typeof safeQuestion> | undefined;

  if (!done) {
    const usedTopics = await prisma.simQuestion.findMany({
      where: { sessionId },
      select: { topic: true },
    });
    const used = usedTopics.map((q2) => q2.topic);
    const updatedSession = { ...session, total: newTotal, score: newScore, ...newStreaks };
    const nextQ = await generateQuestion(updatedSession as any, session.company as any, used);
    const nextQuestion = await prisma.simQuestion.create({
      data: {
        sessionId,
        order: newTotal + 1,
        format: nextQ.format as any,
        prompt: nextQ.prompt,
        topic: nextQ.topic,
        difficulty: nextQ.difficulty,
        options: nextQ.options ?? [],
        correctAnswer: nextQ.correctIndex != null ? String(nextQ.correctIndex) : null,
        explanation: nextQ.explanation,
        rubric: (nextQ.rubric as any) ?? [],
        sourceExperienceId: (nextQ.source as any)?.experienceId ?? null,
        sourceYear: (nextQ.source as any)?.year ?? null,
        sourceRole: (nextQ.source as any)?.role ?? null,
      },
    });
    next = safeQuestion(nextQuestion, false);
  }

  return {
    graded: {
      isCorrect,
      scorePct,
      feedback,
      explanation: q.explanation,
      correctAnswer: q.correctAnswer,
      rubric: q.rubric,
      missing,
    },
    next,
    done,
  };
}

export async function finishSession(userId: string, sessionId: string) {
  const session = await prisma.simSession.findUnique({
    where: { id: sessionId },
    include: { questions: true },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Session not found');
  if (session.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your session');
  if (session.status === 'FINISHED') throw new AppError(400, 'CONFLICT', 'Session already finished');

  const answered = session.questions.filter((q) => q.answeredAt);
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const q of answered) {
    const existing = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
    byTopic.set(q.topic, { correct: existing.correct + (q.isCorrect ? 1 : 0), total: existing.total + 1 });
  }

  const topicAccuracy = [...byTopic.entries()].map(([topic, { correct, total }]) => ({
    topic,
    correct,
    total,
    pct: Math.round((correct / total) * 100),
  }));

  const strengths = topicAccuracy.filter((t) => t.pct >= 80).map((t) => t.topic);
  const revise = topicAccuracy.filter((t) => t.pct < 60).map((t) => t.topic);
  const experienceIds = [...new Set(session.questions.map((q) => q.sourceExperienceId).filter(Boolean))] as string[];

  const summary = { topicAccuracy, strengths, revise, experienceIds };

  await prisma.simSession.update({ where: { id: sessionId }, data: { status: 'FINISHED', summary } });

  return summary;
}

export async function getSession(userId: string, sessionId: string) {
  const session = await prisma.simSession.findUnique({
    where: { id: sessionId },
    include: { questions: { orderBy: { order: 'asc' } }, company: { select: { name: true, slug: true } } },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Session not found');
  if (session.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your session');

  const questions = session.questions.map((q) => safeQuestion(q, !!q.answeredAt));
  return { ...session, questions };
}

export async function listSessions(userId: string, limit = 5) {
  const sessions = await prisma.simSession.findMany({
    where: { userId, status: 'FINISHED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { company: { select: { name: true, slug: true } } },
  });
  return sessions.map((s) => ({
    id: s.id,
    companyName: s.company.name,
    companySlug: s.company.slug,
    roundType: s.roundType,
    score: s.score,
    total: s.total,
    createdAt: s.createdAt,
  }));
}
