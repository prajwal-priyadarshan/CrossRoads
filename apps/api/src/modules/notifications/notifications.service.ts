import {
  NOTIFICATION_GROUPS,
  type MarkReadInput,
  type NotificationListQuery,
  type NotificationPage,
  type NotificationType,
} from '@bridgeup/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { decodeCursor, encodeCursor } from '../../lib/pagination';
import { LIMITS } from '../../config/constants';

const selectFields = {
  id: true,
  type: true,
  title: true,
  body: true,
  link: true,
  isRead: true,
  createdAt: true,
} as const;

export async function listNotifications(userId: string, q: NotificationListQuery): Promise<NotificationPage> {
  const cur = decodeCursor(q.cursor);
  const types = q.group ? NOTIFICATION_GROUPS[q.group].types : null;
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(types ? { type: { in: [...types] } } : {}),
    ...(q.unread ? { isRead: false } : {}),
    ...(cur ? { OR: [{ createdAt: { lt: cur.createdAt } }, { createdAt: cur.createdAt, id: { lt: cur.id } }] } : {}),
  };
  const rows = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: LIMITS.PAGE_SIZE + 1,
    select: selectFields,
  });
  const items = rows.slice(0, LIMITS.PAGE_SIZE);
  const last = items.at(-1);
  return {
    // Notification.type is a plain column (see the list in schema.prisma), not a Prisma enum
    items: items.map((n) => ({ ...n, type: n.type as NotificationType, createdAt: n.createdAt.toISOString() })),
    nextCursor: rows.length > LIMITS.PAGE_SIZE && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

/** Drives the bell badge; polled every 30 seconds by the web app. */
export const unreadCount = async (userId: string) => ({
  count: await prisma.notification.count({ where: { userId, isRead: false } }),
});

export async function markRead(userId: string, body: MarkReadInput) {
  const res = await prisma.notification.updateMany({
    where: { userId, isRead: false, ...(body.all ? {} : { id: { in: body.ids ?? [] } }) },
    data: { isRead: true },
  });
  return { updated: res.count, ...(await unreadCount(userId)) };
}
