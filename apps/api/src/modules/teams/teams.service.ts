import type { Advisor, TeamCard, TeamCreateInput, TeamDetail, TeamListQuery } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { normalizeTag } from '../../lib/text';
import { notify } from '../../services/notify';
import { rankPeople } from '../../services/matching';
import { LIMITS } from '../../config/constants';
import { asMatchProfile, userLiteSelect } from '../users/users.serializers';
import { teamInclude, toTeamBase, toTeamCard } from './teams.serializers';

const viewerSelect = { id: true, skills: true, department: true } as const;

const clean = (xs: string[]) => [...new Set(xs.map(normalizeTag).filter(Boolean))];

/**
 * One model covers four needs: hackathon teams, projects, startups (founder track)
 * and study circles. `kind` drives the UI, `openJoin` makes study circles instant.
 */
export async function listTeams(viewerId: string, q: TeamListQuery): Promise<TeamCard[]> {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: viewerSelect });
  const where: Prisma.TeamWhereInput = {
    isRemoved: false,
    ...(q.includeClosed ? {} : { status: 'OPEN' }),
    ...(q.kind ? { kind: q.kind } : {}),
    ...(q.matchesMe && me.skills.length ? { requiredSkills: { hasSome: me.skills } } : {}),
    ...(q.role ? { rolesNeeded: { has: normalizeTag(q.role) } } : {}),
  };
  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: LIMITS.TEAMS_MAX,
    include: teamInclude(viewerId),
  });
  return teams.map((t) => toTeamCard(t, me));
}

export async function getTeam(viewerId: string, id: string): Promise<TeamDetail> {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: viewerSelect });
  const team = await prisma.team.findFirst({ where: { id, isRemoved: false }, include: teamInclude(viewerId) });
  if (!team) throw notFound('That listing is no longer available');
  const base = toTeamBase(team, me);

  // Only the owner sees who applied, with each applicant's overlap with the required skills
  const applications = base.isOwner
    ? (
        await prisma.teamApplication.findMany({
          where: { teamId: id },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          include: { applicant: { select: { ...userLiteSelect, skills: true } } },
        })
      ).map((a) => {
        const { skills, ...applicant } = a.applicant;
        return {
          id: a.id,
          message: a.message,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
          applicant,
          skillOverlap: team.requiredSkills.filter((s) => skills.includes(s)),
          crossDepartment: !!applicant.department && applicant.department !== team.owner.department,
        };
      })
    : [];

  return { ...base, applications, isFull: base.memberCount >= team.maxMembers };
}

export async function createTeam(ownerId: string, input: TeamCreateInput) {
  const team = await prisma.team.create({
    data: {
      ownerId,
      kind: input.kind,
      title: input.title,
      description: input.description,
      requiredSkills: clean(input.requiredSkills),
      rolesNeeded: clean(input.rolesNeeded),
      commitment: input.commitment,
      maxMembers: input.maxMembers,
      meetingDetails: input.meetingDetails,
      schedule: input.schedule,
      // Instant joining only makes sense for study circles
      openJoin: input.kind === 'STUDY_CIRCLE' ? input.openJoin : false,
    },
    select: { id: true },
  });
  return team;
}

/** Shared guards for apply and join. */
async function openTeamFor(userId: string, teamId: string) {
  const team = await prisma.team.findFirst({
    where: { id: teamId, isRemoved: false },
    include: { _count: { select: { applications: { where: { status: 'ACCEPTED' } } } } },
  });
  if (!team) throw notFound('That listing is no longer available');
  if (team.ownerId === userId) throw badRequest('You own this listing');
  if (team.status === 'CLOSED') throw conflict('This listing is closed');
  if (1 + team._count.applications >= team.maxMembers) throw conflict('This team is full');
  const existing = await prisma.teamApplication.findUnique({
    where: { teamId_applicantId: { teamId, applicantId: userId } },
  });
  if (existing) throw conflict(existing.status === 'ACCEPTED' ? 'You are already a member' : 'You already applied');
  return team;
}

type OpenTeam = { id: string; ownerId: string; title: string; openJoin: boolean };

function createApplication(team: OpenTeam, userId: string, message: string) {
  const teamId = team.id;
  return prisma.$transaction(async (tx) => {
    const app = await tx.teamApplication.create({
      data: { teamId, applicantId: userId, message, status: team.openJoin ? 'ACCEPTED' : 'PENDING' },
    });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, {
      userId: team.ownerId,
      type: 'APPLICATION',
      title: team.openJoin
        ? `${me.fullName} joined ${team.title}`
        : `${me.fullName} wants to join ${team.title}`,
      body: message.slice(0, 100),
      link: `/teams/${teamId}`,
    });
    return { id: app.id, status: app.status };
  });
}

export async function applyToTeam(userId: string, teamId: string, message: string) {
  return createApplication(await openTeamFor(userId, teamId), userId, message);
}

/** Open study circles: one click, no message, instant member. */
export async function joinTeam(userId: string, teamId: string) {
  const team = await openTeamFor(userId, teamId);
  if (!team.openJoin) throw badRequest('This listing needs an application');
  return createApplication(team, userId, 'Joined an open study circle');
}

export async function respondApplication(
  ownerId: string,
  teamId: string,
  appId: string,
  status: 'ACCEPTED' | 'REJECTED',
) {
  const app = await prisma.teamApplication.findFirst({ where: { id: appId, teamId }, include: { team: true } });
  if (!app || app.team.ownerId !== ownerId || app.team.isRemoved) throw notFound();
  if (app.status !== 'PENDING') throw conflict('This application was already answered');

  return prisma.$transaction(async (tx) => {
    // Re-check capacity inside the transaction so two quick accepts cannot overfill the team
    if (status === 'ACCEPTED') {
      const members = 1 + (await tx.teamApplication.count({ where: { teamId, status: 'ACCEPTED' } }));
      if (members >= app.team.maxMembers) throw conflict('This team is full');
    }
    const updated = await tx.teamApplication.update({ where: { id: appId }, data: { status } });
    await notify(tx, {
      userId: app.applicantId,
      type: 'APPLICATION',
      title: status === 'ACCEPTED' ? `You're in! ${app.team.title} accepted you` : `Update on ${app.team.title}`,
      body:
        status === 'ACCEPTED'
          ? 'Say hi to your new team'
          : 'The team went with someone else this time — keep going!',
      link: `/teams/${teamId}`,
    });
    return { id: updated.id, status: updated.status };
  });
}

export async function setTeamStatus(ownerId: string, teamId: string, status: 'OPEN' | 'CLOSED') {
  const team = await prisma.team.findFirst({ where: { id: teamId, isRemoved: false }, select: { ownerId: true } });
  if (!team || team.ownerId !== ownerId) throw notFound();
  const updated = await prisma.team.update({ where: { id: teamId }, data: { status }, select: { id: true, status: true } });
  return updated;
}

const advisorSelect = {
  ...userLiteSelect,
  batchYear: true,
  skills: true,
  interests: true,
  targetRoles: true,
  targetCompanies: true,
  canHelpWith: true,
  lookingFor: true,
  projects: true,
  mentorAvailable: true,
  mentorSlots: true,
  milestones: { where: { category: 'STARTUP' as const }, orderBy: { yearOfStudy: 'desc' as const }, take: 1 },
} as const;

/**
 * Founder track: alumni and seniors who can help with startups, either because they
 * said so in "can help with" or because their journey has a startup milestone.
 */
export async function listAdvisors(viewerId: string): Promise<Advisor[]> {
  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    select: {
      id: true,
      role: true,
      department: true,
      currentYear: true,
      company: true,
      jobTitle: true,
      skills: true,
      interests: true,
      targetRoles: true,
      targetCompanies: true,
      canHelpWith: true,
      lookingFor: true,
      projects: true,
      mentorAvailable: true,
    },
  });
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      onboarded: true,
      role: { in: ['SENIOR', 'ALUMNI'] },
      OR: [{ canHelpWith: { has: 'startups' } }, { milestones: { some: { category: 'STARTUP' } } }],
    },
    select: advisorSelect,
    take: LIMITS.MATCH_CANDIDATES,
  });
  const byId = new Map(candidates.map((c) => [c.id, c]));

  return rankPeople(asMatchProfile(viewer), candidates.map(asMatchProfile), true)
    .slice(0, LIMITS.TEAM_ADVISORS)
    .map(({ candidate, match }) => {
      const u = byId.get(candidate.id)!;
      const milestone = u.milestones[0];
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
        match: match.reasons.length ? match : { ...match, reasons: ['Can help with startups'] },
        foundedNote: milestone ? milestone.title : u.company ? `${u.jobTitle ?? 'Works'} at ${u.company}` : null,
      };
    });
}
