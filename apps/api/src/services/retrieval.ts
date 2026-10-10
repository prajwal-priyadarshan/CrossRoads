import { prisma } from '../lib/prisma';
import { userLiteSelect } from '../modules/users/users.serializers';

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
