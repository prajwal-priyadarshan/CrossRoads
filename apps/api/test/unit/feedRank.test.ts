import { describe, expect, it } from 'vitest';
import { diversify, rankFeed, type FeedPost } from '../../src/services/feedRank';

const NOW = Date.parse('2026-10-10T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 36e5);

const post = (over: Partial<FeedPost> & { id: string }): FeedPost => ({
  kind: 'DISCUSSION',
  topicId: null,
  topic: null,
  tags: [],
  opportunityType: null,
  author: { role: 'STUDENT', department: null },
  score: 0,
  commentCount: 0,
  bestAnswerId: null,
  createdAt: hoursAgo(1),
  ...over,
});

const viewer = { role: 'STUDENT', currentYear: 1, skills: ['python'], interests: ['ai/ml'], alertTypes: ['INTERNSHIP'] };

describe('rankFeed', () => {
  it('ranks a followed topic above an unrelated post of the same age and gives the reason', () => {
    const ranked = rankFeed(
      viewer,
      new Set([2]),
      [post({ id: 'other', topicId: 9 }), post({ id: 'mine', topicId: 2, topic: { name: 'AI/ML' } })],
      NOW,
    );
    expect(ranked[0]!.id).toBe('mine');
    expect(ranked[0]!.reason).toBe('Because you follow AI/ML');
    expect(ranked[1]!.reason).toBeNull();
  });

  it('decays old posts', () => {
    const ranked = rankFeed(viewer, new Set(), [post({ id: 'old', createdAt: hoursAgo(200) }), post({ id: 'new' })], NOW);
    expect(ranked[0]!.id).toBe('new');
  });

  it('flags questions a senior can help with', () => {
    const senior = { ...viewer, role: 'SENIOR', currentYear: 4 };
    const [p] = rankFeed(senior, new Set(), [post({ id: 'q', kind: 'QUESTION', tags: ['python'] })], NOW);
    expect(p!.reason).toBe('You can help: Python');
  });
});

describe('diversify', () => {
  it('breaks up three posts in a row from the same topic', () => {
    const items = [1, 1, 1, 2].map((topicId, i) => ({ id: String(i), topicId }));
    const out = diversify(items);
    expect(out.map((x) => x.topicId)).toEqual([1, 1, 2, 1]);
  });
});
