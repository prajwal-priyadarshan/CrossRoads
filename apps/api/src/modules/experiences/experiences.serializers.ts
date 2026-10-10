import type { ExperienceCard, ExperienceRoundView } from '@crossroads/shared';
import type { Prisma } from '../../generated/prisma/client';
import { userLiteSelect } from '../users/users.serializers';

export const experienceInclude = {
  author: { select: userLiteSelect },
  company: { select: { slug: true, name: true } },
} satisfies Prisma.ExperienceInclude;

export type ExperienceRow = Prisma.ExperienceGetPayload<{ include: typeof experienceInclude }>;

const asRounds = (v: unknown): ExperienceRoundView[] => (Array.isArray(v) ? (v as ExperienceRoundView[]) : []);

export function toExperienceCard(e: ExperienceRow, bookmarked = false): ExperienceCard {
  return {
    id: e.id,
    role: e.role,
    year: e.year,
    rounds: asRounds(e.rounds),
    difficulty: e.difficulty,
    prepWeeks: e.prepWeeks,
    resources: e.resources,
    tips: e.tips,
    // Authors who prefer not to say keep their outcome private
    outcome: e.outcome === 'WITHHELD' ? null : e.outcome,
    isVerified: e.isVerified,
    createdAt: e.createdAt.toISOString(),
    author: e.author,
    company: e.company,
    bookmarked,
  };
}
