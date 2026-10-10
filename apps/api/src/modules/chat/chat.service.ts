import type { ChatConversation, ChatMessage, ChatMessagePage, ChatSendInput } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { decodeCursor, encodeCursor } from '../../lib/pagination';
import { badRequest, forbidden, notFound } from '../../lib/errors';
import type { SessionUser } from '../../middleware/auth';
import { notify } from '../../services/notify';
import { publish } from '../../services/chatHub';
import { LIMITS } from '../../config/constants';
import { userLiteSelect } from '../users/users.serializers';

/** Chat is only open between people who have an accepted connection (any kind). */
const CONNECTED = ['ACCEPTED', 'COMPLETED'] as const;

async function areConnected(a: string, b: string) {
  const c = await prisma.connection.findFirst({
    where: {
      status: { in: [...CONNECTED] },
      OR: [
        { requesterId: a, recipientId: b },
        { requesterId: b, recipientId: a },
      ],
    },
    select: { id: true },
  });
  return Boolean(c);
}

/** Loads a conversation the viewer is part of. Anyone else gets 404, so thread ids cannot be probed. */
async function ownConversation(viewerId: string, id: string) {
  const c = await prisma.conversation.findUnique({ where: { id } });
  if (!c || (c.userAId !== viewerId && c.userBId !== viewerId)) throw notFound('Conversation not found');
  return c;
}

const otherIdFor = (c: { userAId: string; userBId: string }, viewerId: string) =>
  c.userAId === viewerId ? c.userBId : c.userAId;

const readAtFor = (c: { userAId: string; readAtA: Date | null; readAtB: Date | null }, viewerId: string) =>
  c.userAId === viewerId ? c.readAtA : c.readAtB;

export async function listConversations(me: SessionUser): Promise<ChatConversation[]> {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    take: LIMITS.CHAT_LIST_MAX,
    include: { userA: { select: userLiteSelect }, userB: { select: userLiteSelect } },
  });
  return Promise.all(
    rows.map(async (c) => {
      const readAt = readAtFor(c, me.id);
      const unread = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: me.id }, ...(readAt ? { createdAt: { gt: readAt } } : {}) },
      });
      return {
        id: c.id,
        other: c.userAId === me.id ? c.userB : c.userA,
        lastMessagePreview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        lastMessageMine: c.lastMessageSenderId === me.id,
        unread,
      };
    }),
  );
}

/** Opens (or returns) the one thread between two connected people. */
export async function startConversation(me: SessionUser, otherId: string) {
  if (otherId === me.id) throw badRequest('You cannot message yourself');
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, isSuspended: true } });
  if (!other || other.isSuspended) throw notFound('Person not found');
  if (!(await areConnected(me.id, otherId))) throw forbidden('Connect with this person before you message them');

  const [userAId, userBId] = me.id < otherId ? [me.id, otherId] : [otherId, me.id];
  const c = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
    select: { id: true },
  });
  return { id: c.id };
}

export async function listMessages(me: SessionUser, conversationId: string, cursor?: string): Promise<ChatMessagePage> {
  await ownConversation(me.id, conversationId);
  const cur = decodeCursor(cursor);
  const rows = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cur ? { OR: [{ createdAt: { lt: cur.createdAt } }, { createdAt: cur.createdAt, id: { lt: cur.id } }] } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: LIMITS.CHAT_PAGE_SIZE + 1,
  });
  const items = rows.slice(0, LIMITS.CHAT_PAGE_SIZE);
  const last = items.at(-1);
  return {
    items: items.map((m) => toMessage(m, me.id)),
    nextCursor: rows.length > LIMITS.CHAT_PAGE_SIZE && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

const toMessage = (m: { id: string; body: string; createdAt: Date; senderId: string }, viewerId: string): ChatMessage => ({
  id: m.id,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
  mine: m.senderId === viewerId,
});

export async function sendMessage(me: SessionUser, conversationId: string, input: ChatSendInput) {
  const c = await ownConversation(me.id, conversationId);
  const otherId = otherIdFor(c, me.id);
  if (!(await areConnected(me.id, otherId))) throw forbidden('You are no longer connected with this person');

  const sender = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { fullName: true } });
  const otherReadAt = readAtFor(c, otherId);
  // Notify only when the recipient has nothing unread here, so a busy thread does not flood their notifications
  const hadUnread = await prisma.message.findFirst({
    where: { conversationId, senderId: me.id, ...(otherReadAt ? { createdAt: { gt: otherReadAt } } : {}) },
    select: { id: true },
  });
  const now = new Date();
  const preview = input.body.slice(0, 140);

  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { conversationId, senderId: me.id, body: input.body, createdAt: now } });
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview,
        lastMessageSenderId: me.id,
        ...(c.userAId === me.id ? { readAtA: now } : { readAtB: now }),
      },
    });
    if (!hadUnread) {
      await notify(tx, {
        userId: otherId,
        type: 'MESSAGE',
        title: `New message from ${sender.fullName}`,
        body: preview,
        link: `/messages/${conversationId}`,
      });
    }
    return m;
  });
  // Live update: the recipient gets it as incoming, and the sender's other open tabs get it as sent
  publish([otherId], 'chat.message', { conversationId, message: toMessage(message, otherId) });
  publish([me.id], 'chat.message', { conversationId, message: toMessage(message, me.id) });
  return toMessage(message, me.id);
}

export async function markRead(me: SessionUser, conversationId: string) {
  const c = await ownConversation(me.id, conversationId);
  await prisma.conversation.update({
    where: { id: c.id },
    data: c.userAId === me.id ? { readAtA: new Date() } : { readAtB: new Date() },
  });
  return { ok: true };
}
