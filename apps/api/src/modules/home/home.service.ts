import { prisma } from '../../lib/prisma';
import type { SessionUser } from '../../middleware/auth';
import { computeQuests, computeWaysToHelp } from '../../services/quests';
import { thisWeek } from '../events/events.service';
import { suggestedPeople } from '../people/people.service';
import { userLiteSelect } from '../users/users.serializers';

/** Everything the home right rail needs, in one request. */
export async function getRail(viewer: SessionUser, visitedClubs: number) {
  const firstYearish = viewer.role === 'STUDENT' && (viewer.currentYear ?? 1) <= 1;
  const helper = viewer.role === 'SENIOR' || viewer.role === 'ALUMNI';
  const [week, quests, ways, suggested, pending, opportunities, trending, spotlight] = await Promise.all([
    thisWeek(viewer),
    firstYearish ? computeQuests(viewer.id, visitedClubs) : null,
    helper ? computeWaysToHelp(viewer.id) : null,
    suggestedPeople(viewer.id, 3),
    prisma.connection.findMany({
      where: { recipientId: viewer.id, status: 'PENDING' },
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kind: true,
        topic: true,
        message: true,
        createdAt: true,
        requester: { select: userLiteSelect },
      },
    }),
    prisma.post.findMany({
      where: { kind: 'OPPORTUNITY', isRemoved: false, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, opportunityType: true, deadline: true, organization: true },
    }),
    prisma.$queryRaw<Array<{ slug: string; name: string; icon: string; activity: bigint }>>`
      SELECT t.slug, t.name, t.icon, count(*) AS activity
      FROM "Post" p JOIN "Topic" t ON t.id = p."topicId"
      WHERE p."createdAt" > now() - interval '7 days' AND p."isRemoved" = false
      GROUP BY t.slug, t.name, t.icon
      ORDER BY activity DESC
      LIMIT 5`,
    prisma.story.findFirst({
      where: { status: 'PUBLISHED', isSpotlight: true, isRemoved: false },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, excerpt: true, coverUrl: true },
    }),
  ]);
  return {
    thisWeek: week,
    quests,
    waysToHelp: ways,
    suggested,
    pendingRequests: pending,
    opportunities,
    trending: trending.map((t) => ({ ...t, activity: Number(t.activity) })), // bigint is not JSON-serializable
    spotlight,
  };
}
