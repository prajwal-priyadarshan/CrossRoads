import type { OnboardingInput } from '@bridgeup/shared';
import type { User } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { normalizeTag } from '../../lib/text';
import { badRequest } from '../../lib/errors';

/** Serializer for the signed-in user. Never leaks the password hash. */
export function toMe(u: User) {
  const { passwordHash, emailVerified, consentAt, createdAt, updatedAt, ...rest } = u;
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
