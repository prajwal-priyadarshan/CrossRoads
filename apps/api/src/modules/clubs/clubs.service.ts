import type { ClubListQuery, ClubReviewInput } from '@bridgeup/shared';
import { prisma } from '../../lib/prisma';
import { forbidden, notFound } from '../../lib/errors';
import { avg, round1 } from '../../lib/collections';
import { POINTS, awardPoints, evaluateBadges } from '../../services/gamification';
import { userLiteSelect } from '../users/users.serializers';

type Ratings = { usefulness: number; timeCost: number }[];

function summarize(reviews: Ratings) {
  return {
    reviewCount: reviews.length,
    usefulness: reviews.length ? round1(avg(reviews.map((r) => r.usefulness))) : null,
    timeCost: reviews.length ? round1(avg(reviews.map((r) => r.timeCost))) : null,
  };
}

/** First years haven't been members long enough to review. */
export const canReviewClub = (u: { role: string; currentYear: number | null }) =>
  !(u.role === 'STUDENT' && (u.currentYear ?? 1) === 1);

export async function listClubs(q: ClubListQuery) {
  const clubs = await prisma.club.findMany({
    where: q.category ? { category: q.category } : {},
    include: { reviews: { select: { usefulness: true, timeCost: true } } },
  });
  const rows = clubs.map(({ reviews, ...c }) => ({ ...c, ...summarize(reviews) }));
  type Row = (typeof rows)[number];
  const sorters: Record<ClubListQuery['sort'], (a: Row, b: Row) => number> = {
    useful: (a, b) => (b.usefulness ?? 0) - (a.usefulness ?? 0) || b.reviewCount - a.reviewCount,
    light: (a, b) => (a.timeCost ?? 9) - (b.timeCost ?? 9),
    az: (a, b) => a.name.localeCompare(b.name),
  };
  return rows.sort(sorters[q.sort]);
}

export async function getClub(slug: string, viewerId: string) {
  const club = await prisma.club.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { updatedAt: 'desc' }, include: { author: { select: userLiteSelect } } } },
  });
  if (!club) throw notFound('Club not found');
  // "Seniors who were members", taken from journey milestones that mention the club
  const members = await prisma.milestone.findMany({
    where: {
      category: 'CLUB',
      title: { contains: club.name, mode: 'insensitive' },
      user: { onboarded: true, OR: [{ role: { in: ['SENIOR', 'ALUMNI'] } }, { currentYear: { gte: 2 } }] },
    },
    take: 12,
    include: { user: { select: userLiteSelect } },
  });
  const uniqueMembers = [...new Map(members.map((m) => [m.user.id, m.user])).values()].slice(0, 6);
  const { reviews, ...rest } = club;
  return {
    ...rest,
    ...summarize(reviews),
    reviews,
    myReview: reviews.find((r) => r.authorId === viewerId) ?? null,
    members: uniqueMembers,
  };
}

export async function reviewClub(userId: string, slug: string, input: ClubReviewInput) {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, currentYear: true } });
  if (!canReviewClub(me)) throw forbidden('Club reviews come from students who have been members for a while');
  const club = await prisma.club.findUnique({ where: { slug }, select: { id: true } });
  if (!club) throw notFound('Club not found');
  return prisma.$transaction(async (tx) => {
    const review = await tx.clubReview.upsert({
      where: { clubId_authorId: { clubId: club.id, authorId: userId } },
      update: input,
      create: { ...input, clubId: club.id, authorId: userId },
    });
    const earned = await awardPoints(tx, userId, 'CLUB_REVIEW', POINTS.CLUB_REVIEW, review.id); // once per review row
    await evaluateBadges(tx, userId);
    return { review, pointsEarned: earned ? POINTS.CLUB_REVIEW : 0 };
  });
}
