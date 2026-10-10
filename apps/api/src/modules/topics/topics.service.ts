import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export async function listTopics(userId: string) {
  const [topics, follows] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { followers: true, posts: true } } },
    }),
    prisma.topicFollow.findMany({ where: { userId }, select: { topicId: true } }),
  ]);
  const followed = new Set(follows.map((f) => f.topicId));
  return topics.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    icon: t.icon,
    followers: t._count.followers,
    posts: t._count.posts,
    followed: followed.has(t.id),
  }));
}

async function assertTopic(topicId: number) {
  if (!Number.isInteger(topicId) || !(await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }))) {
    throw notFound('Topic not found');
  }
}

export async function follow(userId: string, topicId: number) {
  await assertTopic(topicId);
  await prisma.topicFollow.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {},
    create: { userId, topicId },
  });
}

export async function unfollow(userId: string, topicId: number) {
  await assertTopic(topicId);
  await prisma.topicFollow.deleteMany({ where: { userId, topicId } });
}
