import type { TeamCard } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { userLiteSelect } from '../users/users.serializers';

/** Accepted applicants are members; the viewer's own row comes along so the UI can show its status. */
export const teamInclude = (viewerId: string) =>
  ({
    owner: { select: userLiteSelect },
    applications: {
      where: { OR: [{ status: 'ACCEPTED' as const }, { applicantId: viewerId }] },
      orderBy: { createdAt: 'asc' as const },
      include: { applicant: { select: userLiteSelect } },
    },
    _count: { select: { applications: { where: { status: 'PENDING' as const } } } },
  }) satisfies Prisma.TeamInclude;

type TeamRow = Prisma.TeamGetPayload<{ include: ReturnType<typeof teamInclude> }>;

/** Shared shape for the list and the detail page. */
export function toTeamBase(t: TeamRow, viewer: { id: string; skills: string[] }) {
  const accepted = t.applications.filter((a) => a.status === 'ACCEPTED');
  const mine = t.applications.find((a) => a.applicantId === viewer.id);
  const have = new Set(viewer.skills);
  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    description: t.description,
    requiredSkills: t.requiredSkills,
    rolesNeeded: t.rolesNeeded,
    commitment: t.commitment,
    maxMembers: t.maxMembers,
    meetingDetails: t.meetingDetails,
    schedule: t.schedule,
    openJoin: t.openJoin,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    owner: t.owner,
    members: [t.owner, ...accepted.map((a) => a.applicant)],
    memberCount: 1 + accepted.length,
    skillMatch: t.requiredSkills.filter((s) => have.has(s)),
    isOwner: t.ownerId === viewer.id,
    myApplication: mine
      ? { id: mine.id, status: mine.status, message: mine.message, createdAt: mine.createdAt.toISOString() }
      : null,
    pendingCount: t.ownerId === viewer.id ? t._count.applications : null,
  };
}

export function toTeamCard(t: TeamRow, viewer: { id: string; skills: string[] }): TeamCard {
  const { myApplication, ...base } = toTeamBase(t, viewer);
  return { ...base, myApplicationStatus: myApplication?.status ?? null };
}
