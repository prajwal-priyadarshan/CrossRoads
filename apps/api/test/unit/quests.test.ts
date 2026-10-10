import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { computeQuests, computeWaysToHelp } from '../../src/services/quests';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: { findUniqueOrThrow: vi.fn() },
    topicFollow: { count: vi.fn() },
    post: { count: vi.fn() },
    connection: { count: vi.fn() },
    roadmapSave: { count: vi.fn() },
    clubReview: { count: vi.fn() },
    club: { count: vi.fn() },
    milestone: { count: vi.fn() },
    experience: { count: vi.fn() },
  },
}));

type Counter = { count: Mock };
const db = prisma as unknown as {
  user: { findUniqueOrThrow: Mock };
  topicFollow: Counter;
  post: Counter;
  connection: Counter;
  roadmapSave: Counter;
  clubReview: Counter;
  club: Counter;
  milestone: Counter;
  experience: Counter;
};

type Counts = {
  follows?: number;
  questions?: number;
  requests?: number;
  saves?: number;
  reviews?: number;
  clubs?: number;
  jobMilestones?: number;
  experiences?: number;
};

const me = (over: { skills?: string[]; bio?: string } = {}) =>
  db.user.findUniqueOrThrow.mockResolvedValue({ skills: over.skills ?? [], bio: over.bio ?? '' });

const counts = (c: Counts = {}) => {
  db.topicFollow.count.mockResolvedValue(c.follows ?? 0);
  db.post.count.mockResolvedValue(c.questions ?? 0);
  db.connection.count.mockResolvedValue(c.requests ?? 0);
  db.roadmapSave.count.mockResolvedValue(c.saves ?? 0);
  db.clubReview.count.mockResolvedValue(c.reviews ?? 0);
  db.club.count.mockResolvedValue(c.clubs ?? 0);
  db.milestone.count.mockResolvedValue(c.jobMilestones ?? 0);
  db.experience.count.mockResolvedValue(c.experiences ?? 0);
};

const doneIds = (items: { id: string; done: boolean }[]) => items.filter((q) => q.done).map((q) => q.id);

beforeEach(() => vi.clearAllMocks());

describe('computeQuests', () => {
  it('offers six quests and ticks none for a brand-new student', async () => {
    me();
    counts();
    const q = await computeQuests('u1');
    expect(q.total).toBe(6);
    expect(q.items.map((i) => i.id)).toEqual(['profile', 'topics', 'ask', 'clubs', 'request', 'roadmap']);
    expect(q.done).toBe(0);
    expect(doneIds(q.items)).toEqual([]);
  });

  it('needs three skills and a real bio for the profile quest', async () => {
    me({ skills: ['python', 'sql', 'react'], bio: 'Short' });
    counts();
    expect(doneIds((await computeQuests('u1')).items)).not.toContain('profile');

    me({ skills: ['python', 'sql', 'react'], bio: 'First year CSE-AI, into ML and robotics.' });
    counts();
    expect(doneIds((await computeQuests('u1')).items)).toContain('profile');

    me({ skills: ['python', 'sql'], bio: 'First year CSE-AI, into ML and robotics.' });
    counts();
    expect(doneIds((await computeQuests('u1')).items)).not.toContain('profile');
  });

  it('ticks the clubs quest after three visits or a single review', async () => {
    me();
    counts();
    expect(doneIds((await computeQuests('u1', 3)).items)).toContain('clubs');

    me();
    counts();
    expect(doneIds((await computeQuests('u1', 2)).items)).not.toContain('clubs');

    me();
    counts({ reviews: 1 });
    expect(doneIds((await computeQuests('u1', 0)).items)).toContain('clubs');
  });

  it('counts the quests that are done', async () => {
    me();
    counts({ follows: 3, questions: 1, requests: 1, saves: 1 });
    const q = await computeQuests('u1');
    expect(doneIds(q.items)).toEqual(['topics', 'ask', 'request', 'roadmap']);
    expect(q.done).toBe(4);
  });

  it('needs three follows, not one, for the topics quest', async () => {
    me();
    counts({ follows: 2 });
    expect(doneIds((await computeQuests('u1')).items)).toEqual([]);
  });
});

describe('computeWaysToHelp', () => {
  it('shows nothing when there is nothing to do', async () => {
    me({ skills: ['python'] });
    counts();
    expect(await computeWaysToHelp('u1')).toEqual([]);
  });

  it('skips the question count for someone with no skills', async () => {
    me({ skills: [] });
    counts();
    const ways = await computeWaysToHelp('u1');
    expect(db.post.count).not.toHaveBeenCalled();
    expect(ways.map((w) => w.id)).not.toContain('answer');
  });

  it('uses singular labels for a single item and plural for more', async () => {
    me({ skills: ['python'] });
    counts({ questions: 1, requests: 1 });
    const one = await computeWaysToHelp('u1');
    expect(one.map((w) => w.label)).toEqual([
      '1 unanswered question in your skills',
      '1 pending request',
    ]);

    me({ skills: ['python'] });
    counts({ questions: 4, requests: 2 });
    const many = await computeWaysToHelp('u1');
    expect(many.map((w) => w.label)).toEqual([
      '4 unanswered questions in your skills',
      '2 pending requests',
    ]);
  });

  it('asks for club reviews until three are written, or until every club is reviewed', async () => {
    me({ skills: ['python'] });
    counts({ clubs: 10, reviews: 2 });
    expect((await computeWaysToHelp('u1')).map((w) => w.id)).toContain('clubs');

    me({ skills: ['python'] });
    counts({ clubs: 10, reviews: 3 });
    expect((await computeWaysToHelp('u1')).map((w) => w.id)).not.toContain('clubs');

    // A campus with only two clubs cannot ask for three reviews
    me({ skills: ['python'] });
    counts({ clubs: 2, reviews: 2 });
    expect((await computeWaysToHelp('u1')).map((w) => w.id)).not.toContain('clubs');
  });

  it('asks for an interview experience only from someone hired who has not shared one', async () => {
    me({ skills: ['python'] });
    counts({ jobMilestones: 1 });
    const row = (await computeWaysToHelp('u1')).find((w) => w.id === 'experience')!;
    expect(row).toMatchObject({ label: 'Share an interview experience', href: '/experiences/new' });
    expect(Object.keys(row)).not.toContain('show'); // the internal flag is stripped

    me({ skills: ['python'] });
    counts({ jobMilestones: 1, experiences: 1 });
    expect((await computeWaysToHelp('u1')).map((w) => w.id)).not.toContain('experience');

    me({ skills: ['python'] });
    counts({ jobMilestones: 0 });
    expect((await computeWaysToHelp('u1')).map((w) => w.id)).not.toContain('experience');
  });
});
