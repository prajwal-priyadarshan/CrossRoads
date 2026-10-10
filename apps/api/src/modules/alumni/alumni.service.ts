import { prisma } from '../../lib/prisma';
import type { SessionUser } from '../../middleware/auth';
import { userLiteSelect } from '../users/users.serializers';

const MENTORING_KINDS = ['MENTORSHIP', 'PEER_GUIDANCE'] as const;

/** Everything the alumni dashboard shows, in one request. Only data about this alumnus is returned. */
export async function getAlumniDashboard(viewer: SessionUser) {
  const me = await prisma.user.findUniqueOrThrow({
    where: { id: viewer.id },
    select: { points: true, skills: true, canHelpWith: true },
  });
  const helpTags = [...new Set([...me.canHelpWith, ...me.skills])];

  const [mentorships, pending, pendingCount, answersGiven, bestAnswers, votes, questions, answers] = await Promise.all([
    prisma.connection.findMany({
      where: { recipientId: viewer.id, status: { in: ['ACCEPTED', 'COMPLETED'] }, kind: { in: [...MENTORING_KINDS] } },
      orderBy: { respondedAt: 'desc' },
      select: {
        id: true,
        kind: true,
        topic: true,
        respondedAt: true,
        createdAt: true,
        requester: { select: userLiteSelect },
      },
    }),
    prisma.connection.findMany({
      where: { recipientId: viewer.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, kind: true, topic: true, message: true, createdAt: true, requester: { select: userLiteSelect } },
    }),
    prisma.connection.count({ where: { recipientId: viewer.id, status: 'PENDING' } }),
    prisma.comment.count({
      where: { authorId: viewer.id, isRemoved: false, post: { kind: 'QUESTION', isRemoved: false } },
    }),
    prisma.comment.count({ where: { authorId: viewer.id, bestAnswerOf: { isNot: null } } }),
    prisma.comment.aggregate({ where: { authorId: viewer.id, isRemoved: false }, _sum: { score: true } }),
    helpTags.length
      ? prisma.post.findMany({
          where: {
            kind: 'QUESTION',
            isRemoved: false,
            commentCount: 0,
            authorId: { not: viewer.id },
            tags: { hasSome: helpTags },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, tags: true, createdAt: true, author: { select: userLiteSelect } },
        })
      : Promise.resolve([]),
    prisma.comment.findMany({
      where: { authorId: viewer.id, isRemoved: false, post: { kind: 'QUESTION', isRemoved: false } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        body: true,
        score: true,
        createdAt: true,
        bestAnswerOf: { select: { id: true } },
        post: { select: { id: true, title: true } },
      },
    }),
  ]);

  const menteeIds = new Set(mentorships.map((m) => m.requester.id));
  return {
    stats: {
      mentees: menteeIds.size,
      pendingRequests: pendingCount,
      answersGiven,
      bestAnswers,
      helpfulVotes: votes._sum.score ?? 0,
      points: me.points,
    },
    mentees: mentorships.slice(0, 6).map((m) => ({
      id: m.id,
      kind: m.kind as 'MENTORSHIP' | 'PEER_GUIDANCE',
      topic: m.topic,
      since: (m.respondedAt ?? m.createdAt).toISOString(),
      student: m.requester,
    })),
    pendingRequests: pending.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    openQuestions: questions.map((q) => ({ id: q.id, title: q.title, tags: q.tags, createdAt: q.createdAt.toISOString(), author: q.author })),
    recentAnswers: answers.map((a) => ({
      id: a.id,
      postId: a.post.id,
      postTitle: a.post.title,
      body: a.body,
      score: a.score,
      isBest: Boolean(a.bestAnswerOf),
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
