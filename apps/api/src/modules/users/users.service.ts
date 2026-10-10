import type { OnboardingInput, ProfileUpdateInput } from '@bridgeup/shared';
import type { User } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { normalizeTag } from '../../lib/text';
import { badRequest, notFound } from '../../lib/errors';
import { scoreMatch } from '../../services/matching';
import { asMatchProfile, toPublicProfile } from './users.serializers';

/** Serializer for the signed-in user. Never leaks the password hash. */
export function toMe(u: User) {
  const { passwordHash: _hash, emailVerified: _verified, consentAt: _consent, createdAt: _c, updatedAt: _u, ...rest } = u;
  return rest;
}

const YEAR = { FIRST_YEAR: 1, SECOND_YEAR: 2, THIRD_YEAR: 3, FINAL_YEAR: 4, ALUMNI: null } as const;

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { about, skills, goals, connect } = input;

  // Role is decided here, never by the client
  const invited = await prisma.allowedEmail.findUnique({ where: { email: current.email } });
  let role: 'ADMIN' | 'ALUMNI' | 'SENIOR' | 'STUDENT';
  if (current.role === 'ADMIN') role = 'ADMIN';
  else if (about.status === 'ALUMNI') {
    if (invited?.role !== 'ALUMNI') {
      throw badRequest('Alumni accounts need an invite from an admin.', {
        'about.status': 'Ask an admin to invite you as alumni',
      });
    }
    role = 'ALUMNI';
  } else role = about.status === 'FINAL_YEAR' ? 'SENIOR' : 'STUDENT';

  const uniq = (xs: string[]) => [...new Set(xs.map(normalizeTag).filter(Boolean))];

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        role,
        department: about.department,
        batchYear: about.batchYear,
        currentYear: YEAR[about.status],
        company: about.company || null,
        jobTitle: about.jobTitle || null,
        bio: about.bio ?? '',
        skills: uniq(skills.skills),
        interests: uniq(skills.interests),
        goalTrack: goals.goalTrack,
        targetRoles: uniq(goals.targetRoles),
        targetCompanies: goals.targetCompanies,
        canHelpWith: uniq(connect.canHelpWith),
        lookingFor: uniq(connect.lookingFor),
        linkedinUrl: connect.linkedinUrl || null,
        githubUrl: connect.githubUrl || null,
        showEmail: connect.showEmail,
        showLinkedin: connect.showLinkedin,
        showGithub: connect.showGithub,
        consentAt: new Date(),
        onboarded: true,
      },
    });
    await tx.topicFollow.deleteMany({ where: { userId } });
    await tx.topicFollow.createMany({
      data: goals.followTopicIds.map((topicId) => ({ userId, topicId })),
      skipDuplicates: true,
    });
    // Sensible default alerts: followed topics
    await tx.alertSubscription.upsert({
      where: { userId },
      update: { topicIds: goals.followTopicIds },
      create: { userId, topicIds: goals.followTopicIds, opportunityTypes: ['INTERNSHIP', 'HACKATHON'] },
    });
    return user;
  });
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const uniq = (xs?: string[]) => (xs ? [...new Set(xs.map(normalizeTag).filter(Boolean))] : undefined);
  const blankToNull = (v?: string) => (v === '' ? null : v);
  const { projects, ...rest } = input;
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(projects ? { projects } : {}),
      skills: uniq(input.skills),
      interests: uniq(input.interests),
      targetRoles: uniq(input.targetRoles),
      canHelpWith: uniq(input.canHelpWith),
      lookingFor: uniq(input.lookingFor),
      mentorTopics: uniq(input.mentorTopics),
      company: blankToNull(input.company),
      jobTitle: blankToNull(input.jobTitle),
      linkedinUrl: blankToNull(input.linkedinUrl),
      githubUrl: blankToNull(input.githubUrl),
    },
  });
}

export async function getPublicProfile(handle: string, viewer: { id: string }) {
  const [user, me] = await Promise.all([
    prisma.user.findUnique({
      where: { handle },
      include: { milestones: { orderBy: [{ yearOfStudy: 'asc' }, { createdAt: 'asc' }] } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: viewer.id } }),
  ]);
  if (!user || !user.onboarded) throw notFound('Profile not found');
  const profile = toPublicProfile(user, viewer.id);
  const match = user.id === me.id ? null : scoreMatch(asMatchProfile(me), asMatchProfile(user));
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: me.id, recipientId: user.id },
        { requesterId: user.id, recipientId: me.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, kind: true, status: true, requesterId: true },
  });
  return { ...profile, match, connection };
}

export async function getContributions(handle: string) {
  const user = await prisma.user.findUnique({ where: { handle }, select: { id: true, role: true, points: true } });
  if (!user) throw notFound();
  const id = user.id;
  const [answers, bestAnswers, experiences, reviews, roadmaps, sessions, helpedRows, badges, recent] = await Promise.all([
    prisma.comment.count({ where: { authorId: id, parentId: null, isRemoved: false, post: { kind: 'QUESTION' } } }),
    prisma.post.count({ where: { bestAnswer: { authorId: id } } }),
    prisma.experience.count({ where: { authorId: id, isRemoved: false } }),
    prisma.clubReview.count({ where: { authorId: id } }),
    prisma.roadmap.count({ where: { authorId: id, isAi: false } }),
    prisma.connection.count({ where: { recipientId: id, kind: 'MENTORSHIP', status: 'COMPLETED' } }),
    // distinct people helped = askers of questions they answered + people they mentored
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(DISTINCT x.uid) AS n FROM (
        SELECT p."authorId" AS uid FROM "Comment" c JOIN "Post" p ON p.id = c."postId"
        WHERE c."authorId" = ${id} AND c."parentId" IS NULL AND p.kind = 'QUESTION' AND p."authorId" <> ${id}
        UNION
        SELECT "requesterId" FROM "Connection" WHERE "recipientId" = ${id} AND status IN ('ACCEPTED','COMPLETED')
      ) x`,
    prisma.userBadge.findMany({ where: { userId: id }, include: { badge: true }, orderBy: { awardedAt: 'asc' } }),
    prisma.pointsLedger.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);
  return {
    counts: { answers, bestAnswers, experiences, reviews, roadmaps, sessions },
    helped: Number(helpedRows[0]?.n ?? 0),
    badges: badges.map((b) => ({ ...b.badge, awardedAt: b.awardedAt })),
    recent, // used to render "Recent contributions" (action, points, date)
  };
}

export async function mentorWall() {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const rows = await prisma.pointsLedger.groupBy({
    by: ['userId'],
    // only seniors/alumni who opted in, so students can't crowd out the wall
    where: { createdAt: { gte: start }, user: { role: { in: ['SENIOR', 'ALUMNI'] }, showOnMentorWall: true } },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } }, take: 10,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) }, role: { in: ['SENIOR', 'ALUMNI'] }, showOnMentorWall: true },
    select: { ...userLiteSelect, badges: { include: { badge: true }, take: 1, orderBy: { awardedAt: 'desc' } } },
  });
  return rows
    .map((r) => ({ user: users.find((u) => u.id === r.userId), pointsThisMonth: r._sum.points ?? 0 }))
    .filter((x) => x.user)
    .slice(0, 10);
}
