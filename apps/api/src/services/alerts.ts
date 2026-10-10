import type { OpportunityType, Prisma } from '../generated/prisma/client';
import { LIMITS } from '../config/constants';
import { notifyMany, type Tx } from './notify';

type OpportunityPost = {
  id: string;
  authorId: string;
  title: string;
  topicId: number | null;
  tags: string[];
  opportunityType: OpportunityType | null;
};

/**
 * Notifies everyone whose alert preferences match a new opportunity, inside the
 * creating transaction. Alerts are preferences, not subscriptions to a person:
 * a match on the type, the topic or any tag is enough. The author never gets one.
 * Returns how many people were notified so the UI can report it.
 */
export async function notifyOpportunityAlerts(tx: Tx, post: OpportunityPost) {
  const or: Prisma.AlertSubscriptionWhereInput[] = [];
  if (post.opportunityType) or.push({ opportunityTypes: { has: post.opportunityType } });
  if (post.topicId !== null) or.push({ topicIds: { has: post.topicId } });
  if (post.tags.length) or.push({ tags: { hasSome: post.tags } });
  if (!or.length) return 0;

  const subs = await tx.alertSubscription.findMany({
    where: { enabled: true, userId: { not: post.authorId }, OR: or },
    select: { userId: true },
    take: LIMITS.ALERT_NOTIFY_MAX,
  });
  if (!subs.length) return 0;

  const label = post.opportunityType ? post.opportunityType.replace(/_/g, ' ').toLowerCase() : 'opportunity';
  await notifyMany(
    tx,
    subs.map((s) => s.userId),
    {
      type: 'OPPORTUNITY',
      title: `New ${label}: ${post.title.slice(0, 70)}`,
      body: 'Matches your alert preferences',
      link: `/post/${post.id}`,
    },
  );
  return subs.length;
}
