import type { AlertPrefs, AlertPrefsInput } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { badRequest } from '../../lib/errors';

const prefsSelect = { enabled: true, opportunityTypes: true, topicIds: true, tags: true } as const;

/** Alerts are on by default, so a user with no row yet gets an empty enabled one. */
export async function getAlertPrefs(userId: string): Promise<AlertPrefs> {
  const row = await prisma.alertSubscription.findUnique({ where: { userId }, select: prefsSelect });
  return row ?? { enabled: true, opportunityTypes: [], topicIds: [], tags: [] };
}

export async function updateAlertPrefs(userId: string, input: AlertPrefsInput): Promise<AlertPrefs> {
  const topicIds = [...new Set(input.topicIds)];
  if (topicIds.length) {
    const found = await prisma.topic.count({ where: { id: { in: topicIds } } });
    if (found !== topicIds.length) throw badRequest('One of those topics does not exist', { topicIds: 'Unknown topic' });
  }
  const data = {
    enabled: input.enabled,
    opportunityTypes: [...new Set(input.opportunityTypes)],
    topicIds,
    tags: [...new Set(input.tags)],
  };
  return prisma.alertSubscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: prefsSelect,
  });
}
