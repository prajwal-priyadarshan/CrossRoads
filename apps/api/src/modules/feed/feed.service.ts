import type { FeedQuery } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { rankFeed } from '../../services/feedRank';
import { listPosts, viewerStateFor } from '../posts/posts.service';
import { postInclude, toPostCard } from '../posts/posts.serializers';

const PAGE = 20;

export async function getFeed(viewerId: string, q: FeedQuery) {
  if (q.tab === 'latest' || q.tab === 'top') {
    const page = await listPosts(viewerId, {
      sort: q.tab === 'latest' ? 'latest' : 'top',
      topic: q.topic,
      cursor: q.cursor,
      limit: PAGE,
    });
    return { items: page.items.map((p) => ({ ...p, reason: null })), nextCursor: page.nextCursor };
  }

  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    select: {
      role: true,
      currentYear: true,
      skills: true,
      interests: true,
      topicFollows: { select: { topicId: true } },
      alertSubscription: { select: { opportunityTypes: true } },
    },
  });
  const followed = new Set(viewer.topicFollows.map((f) => f.topicId));
  const base: Prisma.PostWhereInput = { isRemoved: false, ...(q.topic ? { topic: { slug: q.topic } } : {}) };

  // For you: rank recent posts in memory and page with an offset cursor.
  // On a fresh database fall back to a 180-day window so the feed is never empty.
  const since = (days: number) => ({ ...base, createdAt: { gte: new Date(Date.now() - days * 864e5) } });
  let posts = await prisma.post.findMany({ where: since(30), include: postInclude, orderBy: { createdAt: 'desc' }, take: 300 });
  if (posts.length < 10) {
    posts = await prisma.post.findMany({ where: since(180), include: postInclude, orderBy: { createdAt: 'desc' }, take: 300 });
  }

  const ranked = rankFeed(
    {
      role: viewer.role,
      currentYear: viewer.currentYear,
      skills: viewer.skills,
      interests: viewer.interests,
      alertTypes: viewer.alertSubscription?.opportunityTypes ?? [],
    },
    followed,
    posts,
  );
  const offset = Math.max(0, Number(q.cursor) || 0);
  const page = ranked.slice(offset, offset + PAGE);
  const state = await viewerStateFor(viewerId, page);
  return {
    items: page.map((p) => ({ ...toPostCard(p, state), reason: p.reason })),
    nextCursor: offset + PAGE < ranked.length ? String(offset + PAGE) : null,
  };
}
