import { describe, expect, it, vi } from 'vitest';
import { notifyOpportunityAlerts } from '../../src/services/alerts';
import type { Tx } from '../../src/services/notify';

/** notifyOpportunityAlerts takes the transaction client, so a stub is enough here. */
function stubTx(subscribers: string[]) {
  const findMany = vi.fn().mockResolvedValue(subscribers.map((userId) => ({ userId })));
  const createMany = vi.fn().mockResolvedValue({ count: subscribers.length });
  return { tx: { alertSubscription: { findMany }, notification: { createMany } } as unknown as Tx, findMany, createMany };
}

const post = {
  id: 'post-1',
  authorId: 'author-1',
  title: 'Hackathon teammates wanted for the AI track',
  topicId: 5,
  tags: ['python', 'ml'],
  opportunityType: 'HACKATHON' as const,
};

describe('notifyOpportunityAlerts', () => {
  it('matches on the type, the topic or any tag and never notifies the author', async () => {
    const { tx, findMany, createMany } = stubTx(['a', 'b']);
    const alerted = await notifyOpportunityAlerts(tx, post);

    expect(alerted).toBe(2);
    const where = findMany.mock.calls[0]![0].where;
    expect(where.enabled).toBe(true);
    expect(where.userId).toEqual({ not: 'author-1' });
    expect(where.OR).toEqual([
      { opportunityTypes: { has: 'HACKATHON' } },
      { topicIds: { has: 5 } },
      { tags: { hasSome: ['python', 'ml'] } },
    ]);
    const rows = createMany.mock.calls[0]![0].data;
    expect(rows.map((r: { userId: string }) => r.userId)).toEqual(['a', 'b']);
    expect(rows[0].type).toBe('OPPORTUNITY');
    expect(rows[0].title).toBe('New hackathon: Hackathon teammates wanted for the AI track');
    expect(rows[0].link).toBe('/post/post-1');
  });

  it('does not query when there is nothing to match on', async () => {
    const { tx, findMany } = stubTx([]);
    const alerted = await notifyOpportunityAlerts(tx, { ...post, opportunityType: null, topicId: null, tags: [] });

    expect(alerted).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('writes nothing when no preferences match', async () => {
    const { tx, createMany } = stubTx([]);
    expect(await notifyOpportunityAlerts(tx, post)).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('keeps long titles inside the notification title', async () => {
    const { tx, createMany } = stubTx(['a']);
    await notifyOpportunityAlerts(tx, { ...post, title: 'x'.repeat(120) });
    expect(createMany.mock.calls[0]![0].data[0].title).toBe(`New hackathon: ${'x'.repeat(70)}`);
  });
});
