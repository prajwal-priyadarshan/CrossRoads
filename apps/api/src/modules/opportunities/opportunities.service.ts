import type { OpportunityListQuery, OpportunityPage } from '@crossroads/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { titleCase } from '../../lib/text';
import { LIMITS } from '../../config/constants';
import { postInclude, toPostCard } from '../posts/posts.serializers';
import { viewerStateFor } from '../posts/posts.service';

/**
 * Opportunities are posts with kind = OPPORTUNITY, so they reuse voting, comments,
 * bookmarks, search and reporting. Each item carries the reason it is relevant to
 * the viewer: a matching interest or skill first, then their alert preferences.
 *
 * Paginated with a numeric offset cursor: "closing soon" orders by deadline, which
 * is not unique enough for a keyset cursor.
 */
export async function listOpportunities(viewerId: string, q: OpportunityListQuery): Promise<OpportunityPage> {
  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    select: { interests: true, skills: true, alertSubscription: { select: { opportunityTypes: true } } },
  });

  const where: Prisma.PostWhereInput = {
    kind: 'OPPORTUNITY',
    isRemoved: false,
    ...(q.type ? { opportunityType: q.type } : {}),
    ...(q.showPast ? {} : { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }),
  };
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    q.sort === 'closing'
      ? [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }];

  const skip = Math.max(0, Number(q.cursor) || 0);
  const rows = await prisma.post.findMany({ where, orderBy, skip, take: LIMITS.PAGE_SIZE + 1, include: postInclude });
  const items = rows.slice(0, LIMITS.PAGE_SIZE);
  const state = await viewerStateFor(viewerId, items);
  const mine = new Set([...viewer.interests, ...viewer.skills]);
  const alertTypes = new Set(viewer.alertSubscription?.opportunityTypes ?? []);

  return {
    items: items.map((p) => {
      const hit = p.tags.find((t) => mine.has(t));
      const reason = hit
        ? `Matches your interest: ${titleCase(hit)}`
        : p.opportunityType && alertTypes.has(p.opportunityType)
          ? 'Matches your alerts'
          : null;
      return { ...toPostCard(p, state), reason };
    }),
    nextCursor: rows.length > LIMITS.PAGE_SIZE ? String(skip + LIMITS.PAGE_SIZE) : null,
  };
}
