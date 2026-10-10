import type { VoteInput } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { POINTS, awardPoints } from '../../services/gamification';

async function applyVote(userId: string, { targetType, targetId, value }: VoteInput) {
  // The target must exist and not be removed
  let authorId: string;
  let isAnswer = false;
  if (targetType === 'POST') {
    const p = await prisma.post.findFirst({ where: { id: targetId, isRemoved: false }, select: { authorId: true } });
    if (!p) throw notFound();
    authorId = p.authorId;
  } else {
    const c = await prisma.comment.findFirst({
      where: { id: targetId, isRemoved: false, post: { isRemoved: false } },
      select: { authorId: true, parentId: true, post: { select: { kind: true } } },
    });
    if (!c) throw notFound();
    authorId = c.authorId;
    isAnswer = c.post.kind === 'QUESTION' && !c.parentId;
  }

  return prisma.$transaction(async (tx) => {
    const key = { userId_targetType_targetId: { userId, targetType, targetId } };
    const existing = await tx.vote.findUnique({ where: key });
    const old = existing?.value ?? 0;
    if (value === 0) {
      if (existing) await tx.vote.delete({ where: key });
    } else if (existing) await tx.vote.update({ where: key, data: { value } });
    else await tx.vote.create({ data: { userId, targetType, targetId, value } });

    const delta = value - old;
    const updated =
      targetType === 'POST'
        ? await tx.post.update({ where: { id: targetId }, data: { score: { increment: delta } }, select: { score: true } })
        : await tx.comment.update({ where: { id: targetId }, data: { score: { increment: delta } }, select: { score: true } });

    // Helpful vote on an answer: +2 to the answer author, once per voter
    if (isAnswer && value === 1 && authorId !== userId) {
      await awardPoints(tx, authorId, `HELPFUL:${userId}`, POINTS.HELPFUL_VOTE, targetId);
    }
    return { score: updated.score, myVote: value };
  });
}

/** Two quick clicks can race to create the same vote row; the loser retries once and then sees the stored vote. */
export async function castVote(userId: string, input: VoteInput) {
  try {
    return await applyVote(userId, input);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return applyVote(userId, input);
    throw err;
  }
}
