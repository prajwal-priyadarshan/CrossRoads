import type { ExperienceCreateInput } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';
import { normalizeTag } from '../../lib/text';
import { POINTS, awardPoints, evaluateBadges } from '../../services/gamification';
import { experienceInclude, toExperienceCard } from './experiences.serializers';

/** First years haven't been through a process yet, so they can't share experiences. */
export function canShareExperience(u: { role: string; currentYear: number | null }) {
  return !(u.role === 'STUDENT' && (u.currentYear ?? 1) === 1);
}

export async function createExperience(userId: string, input: ExperienceCreateInput) {
  const author = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, currentYear: true } });
  if (!canShareExperience(author)) {
    throw forbidden('Interview experiences are shared by students who have been through a process');
  }
  const company = await prisma.company.findUnique({ where: { id: input.companyId }, select: { slug: true } });
  if (!company) throw badRequest('Choose a company', { companyId: 'Choose a company' });

  const { confidentialityAck: _ack, ...data } = input;
  return prisma.$transaction(async (tx) => {
    const exp = await tx.experience.create({
      data: {
        ...data,
        authorId: userId,
        resources: data.resources,
        rounds: data.rounds.map((r) => ({ ...r, topics: [...new Set(r.topics.map(normalizeTag).filter(Boolean))] })),
      },
    });
    const earned = await awardPoints(tx, userId, 'EXPERIENCE', POINTS.EXPERIENCE, exp.id);
    await evaluateBadges(tx, userId);
    return { id: exp.id, companySlug: company.slug, pointsEarned: earned ? POINTS.EXPERIENCE : 0 };
  });
}

export async function getExperience(viewerId: string, id: string) {
  const e = await prisma.experience.findFirst({ where: { id, isRemoved: false }, include: experienceInclude });
  if (!e) throw notFound('Experience not found');
  const bm = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId: viewerId, targetType: 'EXPERIENCE', targetId: id } },
  });
  return toExperienceCard(e, !!bm);
}
