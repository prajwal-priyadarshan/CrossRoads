import type { PeopleQuery } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { rankPeople } from '../../services/matching';
import { userLiteSelect, asMatchProfile } from '../users/users.serializers';

const matchSelect = {
  ...userLiteSelect,
  skills: true,
  interests: true,
  targetRoles: true,
  targetCompanies: true,
  canHelpWith: true,
  lookingFor: true,
  projects: true,
  mentorAvailable: true,
  mentorTopics: true,
  mentorSlots: true,
  points: true,
  createdAt: true,
  batchYear: true,
} as const;

type Row = Prisma.UserGetPayload<{ select: typeof matchSelect }>;

export async function discoverPeople(viewerId: string, q: PeopleQuery) {
  const viewer = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: matchSelect });

  const and: Prisma.UserWhereInput[] = [];
  const where: Prisma.UserWhereInput = { onboarded: true, id: { not: viewerId }, role: { not: 'ADMIN' }, AND: and };
  if (q.mode === 'mentor') {
    where.role = { in: ['ALUMNI', 'SENIOR'] };
    where.mentorAvailable = true;
  }
  if (q.role) where.role = q.role;
  if (q.department) where.department = q.department;
  if (q.year) where.currentYear = q.year;
  if (q.batch) where.batchYear = q.batch;
  if (q.skills.length) where.skills = { hasSome: q.skills };
  if (q.interests.length) where.interests = { hasSome: q.interests };
  if (q.targetRole) {
    and.push({
      OR: [{ targetRoles: { has: q.targetRole.toLowerCase() } }, { jobTitle: { contains: q.targetRole, mode: 'insensitive' } }],
    });
  }
  if (q.company) where.company = { contains: q.company, mode: 'insensitive' };
  if (q.mentorAvailable) where.mentorAvailable = true;
  if (q.q) {
    and.push({
      OR: [
        { fullName: { contains: q.q, mode: 'insensitive' } },
        { company: { contains: q.q, mode: 'insensitive' } },
        { jobTitle: { contains: q.q, mode: 'insensitive' } },
        { bio: { contains: q.q, mode: 'insensitive' } },
        { skills: { has: q.q.toLowerCase() } },
        { interests: { has: q.q.toLowerCase() } },
      ],
    });
  }

  const candidates = await prisma.user.findMany({ where, select: matchSelect, take: 300 });
  const byId = new Map(candidates.map((c) => [c.id, c]));
  let ranked = rankPeople(asMatchProfile(viewer), candidates.map(asMatchProfile), q.mode === 'mentor').map(
    ({ candidate, match }) => ({ ...byId.get(candidate.id)!, match }),
  );

  if (q.sort === 'helpful') {
    ranked = ranked
      .filter((r) => r.role === 'SENIOR' || r.role === 'ALUMNI')
      .sort((a, b) => b.points - a.points)
      .concat(ranked.filter((r) => r.role === 'STUDENT'));
  }
  if (q.sort === 'newest') ranked = [...ranked].sort((a, b) => +b.createdAt - +a.createdAt);

  return ranked.slice(0, q.limit).map(toPersonCard);
}

function toPersonCard(u: Row & { match: { score: number; reasons: string[] } }) {
  return {
    id: u.id,
    handle: u.handle,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    currentYear: u.currentYear,
    department: u.department,
    batchYear: u.batchYear,
    company: u.company,
    jobTitle: u.jobTitle,
    isVerified: u.isVerified,
    skills: u.skills.slice(0, 4),
    canHelpWith: u.canHelpWith.slice(0, 3),
    mentorAvailable: u.mentorAvailable,
    mentorSlots: u.mentorSlots,
    match: u.match.reasons.length ? u.match : { ...u.match, reasons: ['New to BridgeUp'] },
  };
}

export const suggestedPeople = (viewerId: string, limit = 3) =>
  discoverPeople(viewerId, {
    mode: 'all',
    sort: 'match',
    limit,
    skills: [],
    interests: [],
    mentorAvailable: false,
  });
