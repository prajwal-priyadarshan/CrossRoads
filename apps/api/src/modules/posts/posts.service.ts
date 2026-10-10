import type { CommentCreateInput, PostCreateInput, PostListQuery } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';
import { normalizeTag } from '../../lib/text';
import { decodeCursor, encodeCursor } from '../../lib/pagination';
import { notify, notifyMany } from '../../services/notify';
import { POINTS, awardPoints, evaluateBadges } from '../../services/gamification';
import {
  buildTree,
  commentInclude,
  postInclude,
  toPostCard,
  type PostRow,
  type ViewerState,
} from './posts.serializers';

/** The viewer's votes and bookmarks for a set of posts, plus which questions have a senior/alumni answer. */
export async function viewerStateFor(viewerId: string, posts: Pick<PostRow, 'id' | 'kind'>[]): Promise<ViewerState> {
  const ids = posts.map((p) => p.id);
  const questionIds = posts.filter((p) => p.kind === 'QUESTION').map((p) => p.id);
  const [votes, bookmarks, seniorAnswers] = await Promise.all([
    prisma.vote.findMany({ where: { userId: viewerId, targetType: 'POST', targetId: { in: ids } } }),
    prisma.bookmark.findMany({ where: { userId: viewerId, targetType: 'POST', targetId: { in: ids } } }),
    questionIds.length
      ? prisma.comment.findMany({
          where: {
            postId: { in: questionIds },
            parentId: null,
            isRemoved: false,
            author: { role: { in: ['SENIOR', 'ALUMNI'] } },
          },
          select: { postId: true },
          distinct: ['postId'],
        })
      : Promise.resolve([]),
  ]);
  return {
    votes: new Map(votes.map((v) => [v.targetId, v.value])),
    bookmarks: new Set(bookmarks.map((b) => b.targetId)),
    seniorAnswered: new Set(seniorAnswers.map((c) => c.postId)),
  };
}

export async function listPosts(viewerId: string, q: PostListQuery) {
  const where: Prisma.PostWhereInput = { isRemoved: false };
  if (q.kind) where.kind = q.kind;
  if (q.topic) where.topic = { slug: q.topic };
  if (q.tag) where.tags = { has: normalizeTag(q.tag) };
  if (q.author) where.author = { handle: q.author };
  if (q.sort === 'unanswered') {
    where.kind = 'QUESTION';
    where.commentCount = 0;
  }
  if (q.sort === 'top') where.createdAt = { gte: new Date(Date.now() - 7 * 864e5) };

  const byScore = q.sort === 'top' || q.sort === 'top_all';
  const orderBy: Prisma.PostOrderByWithRelationInput[] = byScore
    ? [{ score: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
    : [{ createdAt: 'desc' }, { id: 'desc' }];

  // Keyset cursor for latest/unanswered; numeric offset for the score sorts keeps things simple
  const cur = byScore ? null : decodeCursor(q.cursor);
  if (cur) {
    where.OR = [{ createdAt: { lt: cur.createdAt } }, { createdAt: cur.createdAt, id: { lt: cur.id } }];
  }
  const skip = byScore ? Math.max(0, Number(q.cursor) || 0) : 0;

  const rows = await prisma.post.findMany({ where, orderBy, take: q.limit + 1, skip, include: postInclude });
  const hasMore = rows.length > q.limit;
  const items = rows.slice(0, q.limit);
  const state = await viewerStateFor(viewerId, items);
  const last = items.at(-1);
  const nextCursor = !hasMore || !last ? null : byScore ? String(skip + q.limit) : encodeCursor(last.createdAt, last.id);
  return { items: items.map((p) => toPostCard(p, state)), nextCursor };
}

export async function createPost(userId: string, input: PostCreateInput) {
  const tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))];
  if (input.topicId !== undefined) {
    const topic = await prisma.topic.findUnique({ where: { id: input.topicId }, select: { id: true } });
    if (!topic) throw badRequest('Choose a topic', { topicId: 'Choose a topic' });
  }

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        authorId: userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        topicId: input.topicId,
        tags,
        ...(input.kind === 'OPPORTUNITY'
          ? {
              opportunityType: input.opportunityType,
              organization: input.organization || null,
              deadline: input.deadline ?? null,
              externalUrl: input.externalUrl || null,
            }
          : {}),
      },
    });

    if (input.kind === 'QUESTION') {
      const helpers = await tx.user.findMany({
        where: {
          id: { not: userId },
          onboarded: true,
          role: { in: ['SENIOR', 'ALUMNI'] },
          OR: [
            ...(tags.length ? [{ skills: { hasSome: tags } }] : []),
            { topicFollows: { some: { topicId: input.topicId } } },
          ],
        },
        orderBy: { points: 'desc' },
        take: 20,
        select: { id: true },
      });
      await notifyMany(tx, helpers.map((h) => h.id), {
        type: 'ANSWER',
        title: 'A junior asked a question you can help with',
        body: input.title.slice(0, 100),
        link: `/ask/${post.id}`,
      });
    }
    // TODO Phase 07: notifyOpportunityAlerts(tx, post) for kind === 'OPPORTUNITY'
    return { id: post.id };
  });
}

export async function getPost(viewerId: string, id: string) {
  const post = await prisma.post.findFirst({ where: { id, isRemoved: false }, include: postInclude });
  if (!post) throw notFound('Post not found');
  const comments = await prisma.comment.findMany({
    where: { postId: id, isRemoved: false },
    orderBy: { createdAt: 'asc' },
    include: commentInclude,
  });
  const targetIds = [id, ...comments.map((c) => c.id)];
  const [votes, state] = await Promise.all([
    prisma.vote.findMany({ where: { userId: viewerId, targetId: { in: targetIds } } }),
    viewerStateFor(viewerId, [post]),
  ]);
  const myVotes = new Map(votes.map((v) => [v.targetId, v.value]));
  return {
    post: { ...toPostCard(post, state), body: post.body },
    comments: buildTree(comments, myVotes, post.bestAnswerId),
    canMarkBest: post.kind === 'QUESTION' && post.authorId === viewerId,
    isAuthor: post.authorId === viewerId,
  };
}

export async function deletePost(user: { id: string; role: string }, id: string) {
  const post = await prisma.post.findFirst({ where: { id, isRemoved: false }, select: { id: true, authorId: true } });
  // 404 for everyone else so we don't reveal that the post exists
  if (!post || (post.authorId !== user.id && user.role !== 'ADMIN')) throw notFound('Post not found');
  await prisma.post.update({ where: { id }, data: { isRemoved: true } });
}

export async function createComment(userId: string, postId: string, input: CommentCreateInput) {
  const post = await prisma.post.findFirst({ where: { id: postId, isRemoved: false } });
  if (!post) throw notFound('Post not found');
  let parent: { authorId: string } | null = null;
  if (input.parentId) {
    const p = await prisma.comment.findFirst({ where: { id: input.parentId, postId, isRemoved: false } });
    if (!p) throw badRequest('Reply target not found');
    if (p.parentId) throw badRequest('Replies can only be one level deep'); // keeps the UI simple
    parent = p;
  }

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { postId, authorId: userId, body: input.body, parentId: input.parentId },
    });
    await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    const link = post.kind === 'QUESTION' ? `/ask/${postId}` : `/post/${postId}`;
    const isAnswer = post.kind === 'QUESTION' && !input.parentId;

    if (post.authorId !== userId) {
      await notify(tx, {
        userId: post.authorId,
        type: isAnswer ? 'ANSWER' : 'COMMENT',
        title: isAnswer ? `${me.fullName} answered your question` : `${me.fullName} commented on your post`,
        body: post.title.slice(0, 100),
        link,
      });
    }
    // Reply: notify the parent author unless they are the replier or already notified as the post author
    if (parent && parent.authorId !== userId && parent.authorId !== post.authorId) {
      await notify(tx, {
        userId: parent.authorId,
        type: 'COMMENT',
        title: `${me.fullName} replied to you`,
        body: post.title.slice(0, 100),
        link,
      });
    }

    let pointsEarned = 0;
    if (isAnswer && post.authorId !== userId) {
      if (await awardPoints(tx, userId, 'ANSWER', POINTS.ANSWER, comment.id)) pointsEarned = POINTS.ANSWER;
      await evaluateBadges(tx, userId);
    }
    return { comment, pointsEarned };
  });
}

export async function markBestAnswer(userId: string, postId: string, commentId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, isRemoved: false } });
  if (!post || post.kind !== 'QUESTION') throw notFound();
  if (post.authorId !== userId) throw forbidden('Only the person who asked can choose the best answer');
  const answer = await prisma.comment.findFirst({ where: { id: commentId, postId, parentId: null, isRemoved: false } });
  if (!answer) throw badRequest('That answer is not on this question');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({ where: { id: postId }, data: { bestAnswerId: commentId } });
    if (answer.authorId !== userId) {
      const firstTime = await awardPoints(tx, answer.authorId, 'BEST_ANSWER', POINTS.BEST_ANSWER, commentId);
      if (firstTime) {
        await notify(tx, {
          userId: answer.authorId,
          type: 'ANSWER',
          title: 'Your answer was marked best 🎉',
          body: post.title.slice(0, 100),
          link: `/ask/${postId}`,
        });
      }
      await evaluateBadges(tx, answer.authorId);
    }
    return updated;
  });
}

export async function similarQuestions(q: string) {
  const term = q.trim();
  if (term.length < 8) return [];
  return prisma.$queryRaw<Array<{ id: string; title: string; commentCount: number; hasBest: boolean; sim: number }>>`
    SELECT id, title, "commentCount", ("bestAnswerId" IS NOT NULL) AS "hasBest", similarity(title, ${term}) AS sim
    FROM "Post"
    WHERE kind = 'QUESTION' AND "isRemoved" = false AND similarity(title, ${term}) > 0.15
    ORDER BY sim DESC
    LIMIT 5`;
}
