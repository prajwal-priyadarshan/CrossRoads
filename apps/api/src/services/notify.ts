import type { Prisma, PrismaClient } from '../generated/prisma/client';

export type Tx = Prisma.TransactionClient | PrismaClient;

type NotificationInput = { userId: string; type: string; title: string; body?: string; link?: string };

export async function notify(tx: Tx, n: NotificationInput) {
  await tx.notification.create({ data: { ...n, body: n.body ?? '' } });
}

export async function notifyMany(tx: Tx, userIds: string[], n: Omit<NotificationInput, 'userId'>) {
  if (!userIds.length) return;
  await tx.notification.createMany({ data: userIds.map((userId) => ({ userId, ...n, body: n.body ?? '' })) });
}
