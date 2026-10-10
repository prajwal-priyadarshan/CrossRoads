import { randomUUID } from 'node:crypto';
import type { ConnectionCreateInput } from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { notify } from '../../services/notify';
import { userLiteSelect } from '../users/users.serializers';

const contactSelect = {
  ...userLiteSelect,
  email: true,
  linkedinUrl: true,
  githubUrl: true,
  showEmail: true,
  showLinkedin: true,
  showGithub: true,
} as const;

type ContactRow = Prisma.UserGetPayload<{ select: typeof contactSelect }>;

/** Reveal contact links only once ACCEPTED/COMPLETED, and only the ones the person chose to show. */
function maskContacts(u: ContactRow, status: string) {
  const { showEmail, showLinkedin, showGithub, email, linkedinUrl, githubUrl, ...rest } = u;
  const open = status === 'ACCEPTED' || status === 'COMPLETED';
  return {
    ...rest,
    email: open && showEmail ? email : null,
    linkedinUrl: open && showLinkedin ? linkedinUrl : null,
    githubUrl: open && showGithub ? githubUrl : null,
  };
}

export async function createRequest(requesterId: string, input: ConnectionCreateInput) {
  if (input.recipientId === requesterId) throw badRequest("You can't send a request to yourself");
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: { id: true, onboarded: true },
  });
  if (!recipient?.onboarded) throw notFound('That person is not available');
  const existing = await prisma.connection.findUnique({
    where: { requesterId_recipientId_kind: { requesterId, recipientId: input.recipientId, kind: input.kind } },
  });
  if (existing && existing.status !== 'DECLINED') throw conflict('You already sent this request');

  return prisma.$transaction(async (tx) => {
    const c = existing
      ? await tx.connection.update({
          where: { id: existing.id },
          data: { message: input.message, topic: input.topic, status: 'PENDING', respondedAt: null },
        })
      : await tx.connection.create({
          data: {
            requesterId,
            recipientId: input.recipientId,
            kind: input.kind,
            message: input.message,
            topic: input.topic,
          },
        });
    const me = await tx.user.findUniqueOrThrow({ where: { id: requesterId }, select: { fullName: true } });
    const label = { CONNECT: 'connection', MENTORSHIP: 'mentorship', COLLAB: 'collaboration', PEER_GUIDANCE: 'peer guidance' }[
      input.kind
    ];
    await notify(tx, {
      userId: input.recipientId,
      type: 'REQUEST',
      title: `${me.fullName} sent you a ${label} request`,
      body: input.topic ?? input.message.slice(0, 100),
      link: '/requests',
    });
    return c;
  });
}

export async function respond(userId: string, id: string, status: 'ACCEPTED' | 'DECLINED') {
  const c = await prisma.connection.findUnique({ where: { id } });
  if (!c || c.recipientId !== userId) throw notFound();
  if (c.status !== 'PENDING') throw conflict('This request was already answered');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.connection.update({ where: { id }, data: { status, respondedAt: new Date() } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, {
      userId: c.requesterId,
      type: 'REQUEST_RESPONSE',
      title: `${me.fullName} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your request`,
      link: '/requests',
    });
    // Phase 08 adds: if ACCEPTED -> evaluateBadges for both users
    return updated;
  });
}

export async function listRequests(userId: string, box: 'incoming' | 'outgoing' | 'completed') {
  const where: Prisma.ConnectionWhereInput =
    box === 'incoming'
      ? { recipientId: userId, status: { in: ['PENDING', 'ACCEPTED'] } }
      : box === 'outgoing'
        ? { requesterId: userId, status: { in: ['PENDING', 'ACCEPTED', 'DECLINED'] } }
        : { OR: [{ requesterId: userId }, { recipientId: userId }], status: 'COMPLETED' };
  const rows = await prisma.connection.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: contactSelect }, recipient: { select: contactSelect } },
  });
  return rows.map((r) => ({
    ...r,
    followUps: Array.isArray(r.followUps) ? r.followUps : [],
    requester: maskContacts(r.requester, r.status),
    recipient: maskContacts(r.recipient, r.status),
  }));
}

/** Only the recipient (the mentor) of an ACCEPTED mentorship / peer-guidance request can complete it. */
export async function complete(userId: string, id: string, sessionNote?: string) {
  const c = await prisma.connection.findUnique({ where: { id } });
  if (!c || c.recipientId !== userId) throw notFound();
  if (!['MENTORSHIP', 'PEER_GUIDANCE'].includes(c.kind)) throw badRequest('Only mentorship sessions can be completed');
  if (c.status !== 'ACCEPTED') throw conflict('Accept the request before completing it');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.connection.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date(), sessionNote: sessionNote || null },
    });
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    await notify(tx, {
      userId: c.requesterId,
      type: 'REQUEST_RESPONSE',
      title: `${me.fullName} marked your session as completed`,
      body: sessionNote ?? '',
      link: '/requests',
    });
    // Phase 08 adds: points for the mentor and the Mentor badge
    return updated;
  });
}

export async function updateFollowUps(
  userId: string,
  id: string,
  followUps: { id: string; text: string; done: boolean }[],
) {
  const c = await prisma.connection.findUnique({ where: { id } });
  if (!c || (c.requesterId !== userId && c.recipientId !== userId)) throw notFound();
  if (c.status !== 'ACCEPTED' && c.status !== 'COMPLETED') throw forbidden('Follow-ups open once the request is accepted');
  const clean = followUps.map((f) => ({ ...f, id: f.id || randomUUID() }));
  return prisma.connection.update({ where: { id }, data: { followUps: clean } });
}
