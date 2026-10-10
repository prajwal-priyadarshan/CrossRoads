import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { findTwins } from '../../src/services/twins';
import { LIMITS } from '../../src/config/constants';

vi.mock('../../src/lib/prisma', () => ({
  prisma: { user: { findUniqueOrThrow: vi.fn(), findMany: vi.fn() } },
}));

const db = prisma as unknown as { user: { findUniqueOrThrow: Mock; findMany: Mock } };

type M = { id: string; yearOfStudy: number; category: string; title: string; description: string | null };
const ms = (yearOfStudy: number, category: string, title: string): M => ({
  id: `${category}-${yearOfStudy}-${title}`,
  yearOfStudy,
  category,
  title,
  description: null,
});

/** A candidate row as the service selects it: userLiteSelect + interests, goalTrack, milestones. */
type C = {
  id: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  currentYear: number | null;
  department: string | null;
  company: string | null;
  jobTitle: string | null;
  isVerified: boolean;
  interests: string[];
  goalTrack: string | null;
  milestones: M[];
};
const candidate = (over: Partial<C> & { id: string }): C => ({
  handle: over.id,
  fullName: 'A Senior',
  avatarUrl: null,
  role: 'SENIOR',
  currentYear: 4,
  department: null,
  company: null,
  jobTitle: null,
  isVerified: true,
  interests: [],
  goalTrack: null,
  milestones: [ms(1, 'PROJECT', 'First project'), ms(2, 'INTERNSHIP', 'Summer intern'), ms(4, 'JOB', 'Offer')],
  ...over,
});

type V = {
  department: string | null;
  interests: string[];
  skills: string[];
  goalTrack: string | null;
  currentYear: number | null;
};
const viewer = (over: Partial<V> = {}): V => ({
  department: 'CSE-AI',
  interests: ['ai/ml'],
  skills: ['python'],
  goalTrack: null,
  currentYear: 1,
  ...over,
});

const run = (v: V, candidates: C[]) => {
  db.user.findUniqueOrThrow.mockResolvedValue(v);
  db.user.findMany.mockResolvedValue(candidates);
  return findTwins('viewer-1');
};

beforeEach(() => vi.clearAllMocks());

describe('findTwins', () => {
  it('needs at least three milestones to count as a twin', async () => {
    const { twins } = await run(viewer(), [
      candidate({ id: 'thin', milestones: [ms(1, 'PROJECT', 'a'), ms(2, 'PROJECT', 'b')] }),
      candidate({ id: 'full' }),
    ]);
    expect(twins.map((t) => t.person.id)).toEqual(['full']);
  });

  it('explains every point and caps a perfect twin at 100', async () => {
    const { twins } = await run(viewer({ interests: ['ai/ml', 'research'], goalTrack: 'PRODUCT' }), [
      candidate({
        id: 'twin',
        department: 'CSE-AI',
        interests: ['ai/ml', 'research'],
        company: 'Northwind Labs',
        goalTrack: 'PRODUCT',
        milestones: [ms(1, 'PROJECT', 'Robotics club'), ms(1, 'COURSE', 'Linear algebra'), ms(2, 'INTERNSHIP', 'Intern')],
      }),
    ]);
    const t = twins[0]!;
    expect(t.score).toBe(100);
    expect(t.reasons).toEqual([
      'Same department (CSE-AI)',
      'Shared interests: AI/ML, Research',
      'Now at Northwind Labs, your goal',
    ]);
    // The milestone list moves under milestonesByYear and leaves the person object
    expect(Object.keys(t.milestonesByYear)).toEqual(['1', '2']);
    expect('milestones' in t.person).toBe(false);
  });

  it('gives no reasons to someone with nothing in common, only the first-year head start', async () => {
    const { twins } = await run(viewer({ goalTrack: 'PRODUCT' }), [
      candidate({ id: 'one-y1' }),
      candidate({
        id: 'two-y1',
        milestones: [ms(1, 'PROJECT', 'a'), ms(1, 'COURSE', 'b'), ms(3, 'JOB', 'c')],
      }),
    ]);
    expect(twins.map((t) => [t.person.id, t.score, t.reasons])).toEqual([
      ['two-y1', 10, []],
      ['one-y1', 5, []],
    ]);
  });

  it('recognises the product path from a job even without a company', async () => {
    const { twins } = await run(viewer({ department: null, goalTrack: 'PRODUCT' }), [
      candidate({ id: 'hired', goalTrack: 'PRODUCT' }),
    ]);
    expect(twins[0]!.reasons).toContain('Landed a product company job');
  });

  it('recognises the startup and higher-studies paths', async () => {
    const founder = candidate({
      id: 'founder',
      milestones: [ms(2, 'STARTUP', 'Founded Payhive'), ms(3, 'PROJECT', 'p'), ms(4, 'OTHER', 'o')],
    });
    const { twins: a } = await run(viewer({ goalTrack: 'STARTUP' }), [founder]);
    expect(a[0]!.reasons).toContain('Founded a startup');

    const { twins: b } = await run(viewer({ goalTrack: 'MS' }), [candidate({ id: 'res', goalTrack: 'RESEARCH' })]);
    expect(b[0]!.reasons).toContain('Took the research / higher-studies path');

    // A milestone title is enough when the track is not set
    const byTitle = candidate({
      id: 'by-title',
      milestones: [ms(4, 'OTHER', 'MS at TU Delft'), ms(1, 'PROJECT', 'p'), ms(2, 'COURSE', 'c')],
    });
    const { twins: c } = await run(viewer({ goalTrack: 'RESEARCH' }), [byTitle]);
    expect(c[0]!.reasons).toContain('Took the research / higher-studies path');
  });

  it('returns the best three twins, highest score first, from a pool of five', async () => {
    const overlaps: Array<[string, Partial<C>]> = [
      ['best', { department: 'CSE-AI', interests: ['ai/ml'], goalTrack: 'PRODUCT' }],
      ['dept-and-interest', { department: 'CSE-AI', interests: ['ai/ml'] }],
      ['dept-only', { department: 'CSE-AI' }],
      ['interest-only', { interests: ['ai/ml'] }],
      ['nothing', {}],
      ['nothing-else', {}],
    ];
    const { twins, poolSize } = await run(
      viewer({ goalTrack: 'PRODUCT' }),
      overlaps.map(([id, over]) => candidate({ id, ...over })),
    );
    expect(twins.map((t) => t.person.id)).toEqual(['best', 'dept-and-interest', 'dept-only']);
    expect(twins.map((t) => t.score)).toEqual([...twins.map((t) => t.score)].sort((x, y) => y - x));
    expect(poolSize).toBe(5);
  });

  it('counts how many twins did each first-year category, not how many milestones', async () => {
    const { year1 } = await run(viewer(), [
      candidate({
        id: 'a',
        department: 'CSE-AI',
        milestones: [ms(1, 'PROJECT', 'Line follower'), ms(1, 'PROJECT', 'Chat bot'), ms(2, 'INTERNSHIP', 'Intern')],
      }),
      candidate({
        id: 'b',
        department: 'CSE-AI',
        milestones: [ms(1, 'PROJECT', 'Line follower'), ms(1, 'COURSE', 'DSA'), ms(4, 'JOB', 'Offer')],
      }),
    ]);
    const projects = year1.find((y) => y.category === 'PROJECT')!;
    expect(projects.count).toBe(2); // two twins, not the three PROJECT milestones
    expect(projects.examples).toEqual(['Line follower', 'Chat bot']); // titles deduped
    expect(year1.find((y) => y.category === 'COURSE')!.count).toBe(1);
    expect(year1.map((y) => y.category)).toEqual(['PROJECT', 'COURSE']); // most twins first
  });

  it('asks only for onboarded seniors and alumni other than the viewer', async () => {
    await run(viewer(), []);
    const args = db.user.findMany.mock.calls[0]![0];
    expect(args.where).toMatchObject({
      id: { not: 'viewer-1' },
      onboarded: true,
      role: { in: ['SENIOR', 'ALUMNI'] },
    });
    expect(args.take).toBe(LIMITS.TWIN_CANDIDATES);
  });
});
