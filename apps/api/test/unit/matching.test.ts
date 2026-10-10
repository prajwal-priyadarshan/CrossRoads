import { describe, expect, it } from 'vitest';
import { rankPeople, scoreMatch, type P } from '../../src/services/matching';

const person = (over: Partial<P>): P => ({
  id: 'x',
  role: 'STUDENT',
  department: null,
  currentYear: 1,
  company: null,
  jobTitle: null,
  skills: [],
  interests: [],
  targetRoles: [],
  targetCompanies: [],
  canHelpWith: [],
  lookingFor: [],
  projects: [],
  mentorAvailable: false,
  ...over,
});

describe('scoreMatch', () => {
  const viewer = person({
    department: 'CSE-AI',
    skills: ['python'],
    interests: ['ai/ml', 'research'],
    lookingFor: ['mentorship'],
    targetRoles: ['ml engineer'],
    targetCompanies: ['northwind-labs'],
  });

  it('explains every point with a reason and stays within 0–100', () => {
    const senior = person({
      id: 's',
      role: 'ALUMNI',
      department: 'CSE-AI',
      company: 'Northwind Labs',
      jobTitle: 'Senior ML Engineer',
      skills: ['python', 'machine learning'],
      interests: ['ai/ml', 'research'],
      canHelpWith: ['mentorship'],
    });
    const m = scoreMatch(viewer, senior);
    expect(m.score).toBeGreaterThan(70);
    expect(m.score).toBeLessThanOrEqual(100);
    expect(m.reasons.length).toBeGreaterThan(0);
    expect(m.reasons).toContain('Works at Northwind Labs, your target company');
  });

  it('matches project text by whole term, so the skill "c" does not match every word', () => {
    const v = person({ skills: ['c'] });
    const c = person({ id: 'c', projects: [{ title: 'Recommendation service', description: 'Scaled a cache layer' }] });
    expect(scoreMatch(v, c).reasons.some((r) => r.includes('Built projects in C'))).toBe(false);
    const c2 = person({ id: 'c2', projects: [{ title: 'Kernel module', description: 'Written in C for a course' }] });
    expect(scoreMatch(v, c2).reasons).toContain('Built projects in C');
  });

  it('returns no reasons for someone with nothing in common', () => {
    expect(scoreMatch(viewer, person({ id: 'z', currentYear: 1 })).reasons).toEqual([]);
  });
});

describe('rankPeople', () => {
  it('sorts by score and boosts available mentors in mentor mode', () => {
    const v = person({ interests: ['ai/ml'] });
    const a = person({ id: 'a', role: 'SENIOR', interests: ['ai/ml'], mentorAvailable: false });
    const b = person({ id: 'b', role: 'SENIOR', interests: ['ai/ml'], mentorAvailable: true });
    const ranked = rankPeople(v, [a, b], true);
    expect(ranked[0]!.candidate.id).toBe('b');
    expect(ranked[0]!.match.score).toBeGreaterThan(ranked[1]!.match.score);
  });
});
