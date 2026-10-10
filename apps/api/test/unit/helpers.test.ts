import { describe, expect, it } from 'vitest';
import { jaccard, normalizeTag, slugify } from '../../src/lib/text';
import { decodeCursor, encodeCursor } from '../../src/lib/pagination';
import { avg, groupBy, round1 } from '../../src/lib/collections';
import { LEVELS } from '@bridgeup/shared';

// levelFor lives with the gamification service; import lazily so the DB client is not needed
const { levelFor } = await import('@bridgeup/shared');

describe('text helpers', () => {
  it('normalises tags', () => expect(normalizeTag('  Machine   Learning ')).toBe('machine learning'));
  it('slugifies names', () => expect(slugify('Rahul Menon!')).toBe('rahul-menon'));
  it('computes jaccard similarity', () => {
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3);
    expect(jaccard([], [])).toBe(0);
  });
});

describe('cursor pagination', () => {
  it('round-trips a cursor', () => {
    const at = new Date('2026-10-10T10:00:00.000Z');
    expect(decodeCursor(encodeCursor(at, 'abc'))).toEqual({ createdAt: at, id: 'abc' });
  });
  it('rejects garbage', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });
});

describe('collections', () => {
  it('groups, averages and rounds', () => {
    expect(groupBy([1, 2, 3], (n) => (n % 2 ? 'odd' : 'even'))).toEqual({ odd: [1, 3], even: [2] });
    expect(round1(avg([4, 5, 5]))).toBe(4.7);
  });
});

describe('levelFor', () => {
  it('maps points to levels with progress to the next one', () => {
    expect(levelFor(0).name).toBe(LEVELS[0]!.name);
    const helper = levelFor(100);
    expect(helper.name).toBe('Helper');
    expect(helper.next).toBe(150);
    expect(helper.progress).toBeCloseTo(0.5);
    expect(levelFor(5000).progress).toBe(1);
  });
});
