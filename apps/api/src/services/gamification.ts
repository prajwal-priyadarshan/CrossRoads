import { levelFor } from '@crossroads/shared';
import type { Tx } from './notify';

export const POINTS = {
  ANSWER: 5,
  HELPFUL_VOTE: 2,
  BEST_ANSWER: 15,
  EXPERIENCE: 20,
  CLUB_REVIEW: 5,
  ROADMAP: 20,
  MENTOR_SESSION: 25,
} as const;

/** Awards points once per (user, action, refId). Returns true if points were added. */
export async function awardPoints(tx: Tx, userId: string, action: string, points: number, refId: string) {
  const created = await tx.pointsLedger.createMany({
    data: [{ userId, action, points, refId }],
    skipDuplicates: true, // relies on @@unique([userId, action, refId])
  });
  if (created.count === 0) return false;
  await tx.user.update({ where: { id: userId }, data: { points: { increment: points } } });
  return true;
}

/** Grants a badge once and notifies the user. */
export async function grantBadge(tx: Tx, userId: string, badgeSlug: string) {
  const res = await tx.userBadge.createMany({ data: [{ userId, badgeSlug }], skipDuplicates: true });
  if (res.count === 0) return false;
  const badge = await tx.badge.findUnique({ where: { slug: badgeSlug } });
  if (badge) {
    await tx.notification.create({
      data: { userId, type: 'BADGE', title: `Badge unlocked: ${badge.name}`, body: badge.description, link: '/me' },
    });
  }
  return true;
}

/** Re-checks count-based badges after a contribution. */
export async function evaluateBadges(tx: Tx, userId: string) {
  const [answers, bests, experiences, reviews, roadmaps, sessions, connections] = await Promise.all([
    tx.comment.count({ where: { authorId: userId, parentId: null, post: { kind: 'QUESTION' } } }),
    tx.post.count({ where: { bestAnswer: { authorId: userId } } }),
    tx.experience.count({ where: { authorId: userId } }),
    tx.clubReview.count({ where: { authorId: userId } }),
    tx.roadmap.count({ where: { authorId: userId, isAi: false } }),
    tx.connection.count({ where: { recipientId: userId, kind: 'MENTORSHIP', status: 'COMPLETED' } }),
    tx.connection.count({
      where: { OR: [{ requesterId: userId }, { recipientId: userId }], status: { in: ['ACCEPTED', 'COMPLETED'] } },
    }),
  ]);
  const grants: string[] = [];
  if (answers >= 1) grants.push('first-answer');
  if (answers >= 10) grants.push('answer-machine');
  if (bests >= 3) grants.push('trusted-voice');
  if (experiences >= 1) grants.push('experience-sharer');
  if (reviews >= 1) grants.push('club-reviewer');
  if (roadmaps >= 1) grants.push('roadmap-author');
  if (sessions >= 1) grants.push('mentor');
  if (connections >= 10) grants.push('bridge-builder');
  for (const slug of grants) await grantBadge(tx, userId, slug);
}

