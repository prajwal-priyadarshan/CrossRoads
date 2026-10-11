import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { userLiteSelect } from '../users/users.serializers';
import { LIMITS } from '../../config/constants';
import { encodeCursor, decodeCursor } from '../../lib/pagination';

export async function listStories(q: { tag?: string; cursor?: string }) {
  const cur = decodeCursor(q.cursor);
  const rows = await prisma.story.findMany({
    where: {
      status: 'PUBLISHED',
      isRemoved: false,
      ...(q.tag ? { tags: { has: q.tag } } : {}),
      ...(cur ? { OR: [{ publishedAt: { lt: cur.createdAt } }, { publishedAt: cur.createdAt, id: { lt: cur.id } }] } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: LIMITS.PAGE_SIZE + 1,
    include: { featuredUser: { select: userLiteSelect } }
  });
  
  const items = rows.slice(0, LIMITS.PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > LIMITS.PAGE_SIZE && last?.publishedAt ? encodeCursor(last.publishedAt, last.id) : null
  };
}

export async function getStory(slug: string) {
  const story = await prisma.story.findFirst({
    where: { slug, status: 'PUBLISHED', isRemoved: false },
    include: { featuredUser: { select: userLiteSelect } }
  });
  if (!story) throw notFound('Story not found');

  const related = story.tags.length > 0 ? await prisma.story.findMany({
    where: { 
      id: { not: story.id }, 
      status: 'PUBLISHED', 
      isRemoved: false,
      tags: { hasSome: story.tags }
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    include: { featuredUser: { select: userLiteSelect } }
  }) : [];

  return { ...story, story, related };
}
