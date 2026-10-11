import { prisma } from '../lib/prisma';
import { groupBy } from '../lib/collections';
import { jaccard, titleCase } from '../lib/text';
import { userLiteSelect } from '../modules/users/users.serializers';
import { LIMITS } from '../config/constants';
import { cached } from '../lib/cache';
import { generateJSON, AIError } from '../lib/ai';
import { logger } from '../lib/logger';
import { aiEnabled } from '../config/env';
import { aiTwinInsightsOut } from '@crossroads/shared';

type Candidate = {
  company: string | null;
  goalTrack: string | null;
  milestones: { category: string; title: string }[];
};

const hasMilestone = (c: Candidate, category: string) => c.milestones.some((m) => m.category === category);
const mentions = (c: Candidate, re: RegExp) => c.milestones.some((m) => re.test(m.title));

/** goalMatch from TRD §11.3; returns the reason text or null. */
function goalReason(goal: string | null, c: Candidate): string | null {
  switch (goal) {
    case 'PRODUCT':
      if ((hasMilestone(c, 'JOB') || c.company) && c.goalTrack === 'PRODUCT') {
        return c.company ? `Now at ${c.company}, your goal` : 'Landed a product company job';
      }
      return null;
    case 'STARTUP':
      return hasMilestone(c, 'STARTUP') ? 'Founded a startup' : null;
    case 'RESEARCH':
    case 'MS':
      return c.goalTrack === 'RESEARCH' || c.goalTrack === 'MS' || mentions(c, /research|\bms\b/i)
        ? 'Took the research / higher-studies path'
        : null;
    default:
      return goal && c.goalTrack === goal ? 'Same goal as you' : null;
  }
}

export async function findTwins(viewerId: string) {
  const v = await prisma.user.findUniqueOrThrow({
    where: { id: viewerId },
    select: { department: true, interests: true, skills: true, goalTrack: true, currentYear: true },
  });
  const candidates = await prisma.user.findMany({
    where: { id: { not: viewerId }, onboarded: true, role: { in: ['SENIOR', 'ALUMNI'] }, milestones: { some: {} } },
    select: {
      ...userLiteSelect,
      interests: true,
      goalTrack: true,
      milestones: {
        orderBy: [{ yearOfStudy: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, yearOfStudy: true, category: true, title: true, description: true },
      },
    },
    take: LIMITS.TWIN_CANDIDATES,
  });

  const scored = candidates
    .filter((c) => c.milestones.length >= 3)
    .map((c) => {
      const reasons: string[] = [];
      let s = 0;
      if (v.department && v.department === c.department) {
        s += 35;
        reasons.push(`Same department (${c.department})`);
      }
      const j = jaccard(v.interests, c.interests);
      if (j > 0) {
        s += 35 * j;
        const shared = v.interests.filter((i) => c.interests.includes(i)).slice(0, 2);
        reasons.push(`Shared interests: ${shared.map((x) => titleCase(x)).join(', ')}`);
      }
      const goal = goalReason(v.goalTrack, c);
      if (goal) {
        s += 20;
        reasons.push(goal);
      }
      const y1 = c.milestones.filter((m) => m.yearOfStudy === 1).length;
      s += 10 * Math.min(1, y1 / 2);
      return { person: c, score: Math.round(s), reasons };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const pool = scored
    .slice(0, 5)
    .flatMap((t) => t.person.milestones.filter((m) => m.yearOfStudy === 1).map((m) => ({ ...m, ownerId: t.person.id })));
  const year1 = Object.entries(groupBy(pool, (m) => m.category))
    .map(([category, items]) => ({
      category,
      count: new Set(items.map((i) => i.ownerId)).size, // how many twins, not how many milestones
      examples: [...new Set(items.map((i) => i.title))].slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count);

  const twins = top.map(({ person: { milestones, ...person }, score, reasons }) => ({
    person,
    score,
    reasons,
    milestonesByYear: groupBy(milestones, (m) => String(m.yearOfStudy)),
  }));
  const insights = await aiTwinInsights(viewerId, { department: v.department, interests: v.interests, goalTrack: v.goalTrack }, twins);

  return {
    startingPoint: {
      department: v.department,
      interests: v.interests,
      goalTrack: v.goalTrack,
      skills: v.skills,
      currentYear: v.currentYear,
    },
    twins: twins.map((t) => ({ ...t, aiInsight: insights.get(t.person.id) ?? null })),
    year1,
    poolSize: Math.min(5, scored.length),
  };
}

const TWIN_INSIGHT_PROMPT = `You explain to a student why a senior or alumni is a good "path twin" — someone who started in a similar place and can show them what's ahead. For each person given, write ONE warm, specific sentence (at most two) grounded ONLY in the reasons and milestones provided — never invent facts or companies not mentioned. Mention one concrete thing the student could learn from or ask them about. Return only valid JSON matching the given shape, with exactly one entry per personId given.`;

type TwinForInsight = {
  person: { id: string; fullName: string; role: string; company: string | null; jobTitle: string | null };
  reasons: string[];
  milestonesByYear: Record<string, { title: string }[]>;
};

/** Personalised one-liners on top of the (already final) deterministic ranking — AI explains, it never re-ranks. Cached per viewer + twin set. */
async function aiTwinInsights(
  viewerId: string,
  startingPoint: { department: string | null; interests: string[]; goalTrack: string | null },
  top: TwinForInsight[],
): Promise<Map<string, string>> {
  if (!aiEnabled || !top.length) return new Map();

  const key = `twins:${viewerId}:${top.map((t) => `${t.person.id}:${t.reasons.length}`).join(',')}`;
  try {
    const out = await cached(key, 24 * 60 * 60_000, () => {
      const people = top
        .map((t) => {
          const year1 = (t.milestonesByYear['1'] ?? []).map((m) => m.title).slice(0, 3);
          const now = t.person.company ? `, now ${t.person.jobTitle ?? 'works'} at ${t.person.company}` : '';
          return `- id=${t.person.id} name=${t.person.fullName} (${t.person.role}${now}) — reasons: ${
            t.reasons.join('; ') || 'similar starting point'
          }; first-year milestones: ${year1.join(', ') || 'none recorded'}`;
        })
        .join('\n');
      return generateJSON({
        system: TWIN_INSIGHT_PROMPT,
        user: `Student: department ${startingPoint.department ?? 'unknown'}, interests ${
          startingPoint.interests.join(', ') || 'none'
        }, goal ${startingPoint.goalTrack ?? 'exploring'}.\n\nPath twins:\n${people}`,
        schema: aiTwinInsightsOut,
        maxTokens: 400,
      });
    });
    return new Map(out.insights.map((i: { personId: string; insight: string }) => [i.personId, i.insight]));
  } catch (err) {
    if (!(err instanceof AIError)) logger.warn({ err }, 'unexpected error generating twin insights');
    else logger.warn({ err }, 'AI call failed, path twins will show the deterministic reasons only');
    return new Map();
  }
}
