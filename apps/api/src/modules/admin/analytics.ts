import type { AdminAnalytics } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';

const DAY_MS = 864e5;

/** Institution overview for staff: counts only, no message content. Figures are for the last 30 days unless stated. */
export async function institutionAnalytics(): Promise<AdminAnalytics> {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const [users, roleGroups, batchGroups, departmentGroups, questions, comments, posters, commenters, accepted, completed] = await Promise.all([
    prisma.user.count({ where: { isSuspended: false } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['batchYear'], where: { batchYear: { not: null } }, _count: { _all: true }, orderBy: { batchYear: 'asc' } }),
    prisma.user.groupBy({ by: ['department'], where: { department: { not: null } }, _count: { _all: true } }),
    prisma.post.count({ where: { kind: 'QUESTION', isRemoved: false, createdAt: { gte: since } } }),
    prisma.comment.findMany({
      where: { isRemoved: false, createdAt: { gte: since } },
      select: { authorId: true, author: { select: { department: true } } },
    }),
    prisma.post.findMany({ where: { createdAt: { gte: since } }, distinct: ['authorId'], select: { authorId: true } }),
    prisma.comment.findMany({ where: { createdAt: { gte: since } }, distinct: ['authorId'], select: { authorId: true } }),
    prisma.connection.count({ where: { kind: 'MENTORSHIP', status: 'ACCEPTED' } }),
    prisma.connection.count({ where: { kind: 'MENTORSHIP', status: 'COMPLETED' } }),
  ]);

  const activeIds = new Set([...posters.map((p) => p.authorId), ...commenters.map((c) => c.authorId)]);
  const answersByDept = new Map<string, number>();
  for (const c of comments) {
    const dept = c.author?.department;
    if (dept) answersByDept.set(dept, (answersByDept.get(dept) ?? 0) + 1);
  }
  const usersByDept = new Map(departmentGroups.map((g) => [g.department as string, g._count._all]));
  const departments = [...new Set([...usersByDept.keys(), ...answersByDept.keys()])];

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users,
      active30d: activeIds.size,
      questions30d: questions,
      answers30d: comments.length,
      mentorshipsAccepted: accepted,
      mentorshipsCompleted: completed,
    },
    byRole: Object.fromEntries(roleGroups.map((g) => [g.role, g._count._all])),
    byDepartment: departments
      .map((d) => ({ department: d, users: usersByDept.get(d) ?? 0, answers: answersByDept.get(d) ?? 0 }))
      .sort((a, b) => b.users - a.users),
    byBatch: batchGroups.map((g) => ({ batchYear: g.batchYear as number, users: g._count._all })),
  };
}

/** Posts from a college office. Created by staff accounts only (the route enforces ADMIN). */
export async function createOfficialPost(authorId: string, input: { title: string; body: string; officeName: string }) {
  const post = await prisma.post.create({
    data: { authorId, kind: 'DISCUSSION', title: input.title, body: input.body, officeName: input.officeName, tags: ['official'] },
    select: { id: true },
  });
  if (!post) throw new AppError(500, 'INTERNAL', 'Could not create the post');
  return { id: post.id };
}
