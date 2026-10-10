import type { BookmarkInput } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { postInclude, toPostCard } from '../posts/posts.serializers';
import { viewerStateFor } from '../posts/posts.service';

type Target = BookmarkInput['targetType'];

async function targetExists(type: Target, id: string) {
  switch (type) {
    case 'POST':
      return !!(await prisma.post.findFirst({ where: { id, isRemoved: false }, select: { id: true } }));
    case 'EXPERIENCE':
      return !!(await prisma.experience.findFirst({ where: { id, isRemoved: false }, select: { id: true } }));
    case 'ROADMAP':
      return !!(await prisma.roadmap.findFirst({ where: { id, isPublic: true }, select: { id: true } }));
    case 'STORY':
      return !!(await prisma.story.findFirst({ where: { id, isRemoved: false, status: 'PUBLISHED' }, select: { id: true } }));
  }
}

export async function toggleBookmark(userId: string, { targetType, targetId }: BookmarkInput) {
  if (!(await targetExists(targetType, targetId))) throw notFound();
  const key = { userId_targetType_targetId: { userId, targetType, targetId } };
  const existing = await prisma.bookmark.findUnique({ where: key });
  if (existing) {
    await prisma.bookmark.delete({ where: key });
    return { bookmarked: false };
  }
  await prisma.bookmark.create({ data: { userId, targetType, targetId } });
  return { bookmarked: true };
}

/** Bookmarks grouped by type, newest first, with removed targets skipped. */
export async function listBookmarks(userId: string, type?: Target) {
  const rows = await prisma.bookmark.findMany({
    where: { userId, ...(type ? { targetType: type } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  const ids = (t: Target) => rows.filter((r) => r.targetType === t).map((r) => r.targetId);
  const ordered = <T extends { id: string }>(t: Target, items: T[]) => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return ids(t)
      .map((id) => byId.get(id))
      .filter((x): x is T => !!x);
  };

  const [posts, experiences, roadmaps, stories] = await Promise.all([
    prisma.post.findMany({ where: { id: { in: ids('POST') }, isRemoved: false }, include: postInclude }),
    prisma.experience.findMany({
      where: { id: { in: ids('EXPERIENCE') }, isRemoved: false },
      select: { id: true, role: true, year: true, company: { select: { slug: true, name: true } } },
    }),
    prisma.roadmap.findMany({
      where: { id: { in: ids('ROADMAP') } },
      select: { id: true, title: true, goalTrack: true, saveCount: true },
    }),
    prisma.story.findMany({
      where: { id: { in: ids('STORY') }, isRemoved: false, status: 'PUBLISHED' },
      select: { id: true, slug: true, title: true, excerpt: true },
    }),
  ]);
  const state = await viewerStateFor(userId, posts);

  return {
    posts: ordered('POST', posts).map((p) => toPostCard(p, state)),
    experiences: ordered('EXPERIENCE', experiences).map((e) => ({
      id: e.id,
      title: `${e.company.name}: ${e.role}`,
      subtitle: `Interview experience · ${e.year}`,
      url: `/companies/${e.company.slug}#exp-${e.id}`,
    })),
    roadmaps: ordered('ROADMAP', roadmaps).map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: `${r.saveCount} saves`,
      url: `/roadmaps/${r.id}`,
    })),
    stories: ordered('STORY', stories).map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.excerpt.slice(0, 120),
      url: `/stories/${s.slug}`,
    })),
  };
}
