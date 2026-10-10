import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env, aiEnabled } from '../config/env';
import { generateJSON } from '../lib/ai';
import { aiRoadmapOut } from '@bridgeup/shared';
import { findTwins } from './twins';

const GOAL_LABEL: Record<string, string> = {
  PRODUCT: 'Product',
  SERVICE: 'Service',
  QUANT_FINANCE: 'Quant Finance',
  RESEARCH: 'Research',
  STARTUP: 'Startup',
  MS: 'MS',
  MBA: 'MBA',
  UNDECIDED: 'Career',
};

const ROADMAP_SYSTEM_PROMPT = `You are a placement advisor at an Indian engineering college. Generate a personalised semester roadmap as JSON with the exact schema provided. Only plan steps from semester <current semester> onwards. Every step must be actionable. Return only valid JSON.`;

type StepIn = { id: string; title: string; detail?: string; semester: number; kind: string; resources?: string[] };
const prepItemsOf = (c: { prepRoadmap: unknown }) =>
  z.array(z.object({ title: z.string(), detail: z.string().default('') })).catch([]).parse(c.prepRoadmap);

export async function gatherContext(userId: string, input: { goalTrack?: string; targetRole?: string; targetCompanySlugs?: string[] }) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentYear: true, department: true, skills: true, interests: true, targetCompanies: true, goalTrack: true },
  });

  const slugs: string[] = input.targetCompanySlugs?.length ? input.targetCompanySlugs : user.targetCompanies;
  const goalTrack = input.goalTrack ?? user.goalTrack ?? 'UNDECIDED';

  const [roadmaps, companies, twinsResult] = await Promise.all([
    prisma.roadmap.findMany({
      where: { goalTrack: goalTrack as any, isPublic: true, isAi: false },
      orderBy: { saveCount: 'desc' },
      take: 3,
    }),
    slugs.length
      ? prisma.company.findMany({
          where: { slug: { in: slugs } },
          include: {
            experiences: { where: { isRemoved: false }, orderBy: { year: 'desc' }, take: 5 },
          },
        })
      : Promise.resolve([]),
    findTwins(userId).catch(() => ({ twins: [] as any[] })),
  ]);

  const month = new Date().getMonth() + 1;
  const startMonth = env.ACADEMIC_YEAR_START_MONTH;
  const inOddSemester = ((month - startMonth + 12) % 12) < 6;
  const year = user.currentYear ?? 1;
  const semester = Math.min(8, Math.max(1, (year - 1) * 2 + (inOddSemester ? 1 : 2)));

  return { user, semester, goalTrack, roadmaps, companies, twins: twinsResult.twins.slice(0, 3), targetRole: input.targetRole };
}

type Ctx = Awaited<ReturnType<typeof gatherContext>>;

export function computeGaps(ctx: Ctx) {
  const counts = new Map<string, number>();
  for (const c of ctx.companies) {
    for (const s of c.skillsTested) {
      if (!ctx.user.skills.includes(s)) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, n]) => ({
      skill,
      why: `Tested by ${n} of your ${ctx.companies.length} target compan${ctx.companies.length === 1 ? 'y' : 'ies'}`,
      priority: n >= 2 ? ('high' as const) : ('medium' as const),
    }));
}

export function deterministicRoadmap(ctx: Ctx, goalTrack: string) {
  const base = ctx.roadmaps[0];
  const baseSteps: StepIn[] = Array.isArray(base?.steps) ? (base.steps as StepIn[]) : [];
  const steps = baseSteps
    .filter((s) => s.semester >= ctx.semester)
    .map((s) => ({ ...s, id: randomUUID(), detail: s.detail ?? '', resources: s.resources ?? [] }));

  const gaps = computeGaps(ctx);
  gaps
    .filter((g) => g.priority === 'high')
    .slice(0, 4)
    .forEach((g, i) =>
      steps.push({
        id: randomUUID(),
        title: `Learn ${g.skill.charAt(0).toUpperCase() + g.skill.slice(1)}`,
        detail: g.why,
        semester: Math.min(8, ctx.semester + i),
        kind: 'SKILL',
        resources: [],
      }),
    );

  for (const c of ctx.companies) {
    for (const p of prepItemsOf(c).slice(0, 2)) {
      steps.push({
        id: randomUUID(),
        title: `${c.name}: ${p.title}`,
        detail: p.detail,
        semester: Math.min(8, ctx.semester + 2),
        kind: 'PRACTICE',
        resources: [],
      });
    }
  }

  steps.sort((a, b) => a.semester - b.semester);

  const label = GOAL_LABEL[goalTrack] ?? 'Career';
  return {
    title: `My ${label} plan`,
    summary: base
      ? `Built from "${base.title}" and your target companies' requirements.`
      : 'Built from your target companies\' requirements.',
    gaps,
    steps,
  };
}

export async function aiRoadmap(ctx: Ctx, goalTrack: string) {
  const label = GOAL_LABEL[goalTrack] ?? goalTrack;
  const user = [
    `Student: year ${ctx.user.currentYear}, department ${ctx.user.department}, current semester ${ctx.semester}.`,
    `Current skills: ${ctx.user.skills.join(', ') || 'none yet'}. Interests: ${ctx.user.interests.join(', ') || 'none yet'}.`,
    `Goal: ${label}${ctx.targetRole ? `, target role ${ctx.targetRole}` : ''}.`,
    `Target companies:\n${
      ctx.companies.length
        ? ctx.companies
            .map(
              (c) =>
                `- ${c.name}: skills tested ${c.skillsTested.join(', ')}; experience topics ${[
                  ...new Set(
                    c.experiences.flatMap((e) =>
                      (e.rounds as any[]).flatMap((r) => r.topics as string[]),
                    ),
                  ),
                ]
                  .slice(0, 15)
                  .join(', ')}`,
            )
            .join('\n')
        : 'none chosen'
    }`,
    `Alumni roadmaps:\n${
      ctx.roadmaps.length
        ? ctx.roadmaps
            .map(
              (r) =>
                `- "${r.title}": ${(r.steps as any[]).map((s: any) => `S${s.semester} ${s.title}`).join('; ')}`,
            )
            .join('\n')
        : 'none'
    }`,
    `Alumni journeys:\n${
      ctx.twins.length
        ? ctx.twins
            .map((t) =>
              Object.entries(t.milestonesByYear as Record<string, any[]>)
                .map(([y, ms]) => `Y${y}: ${ms.map((m) => m.title).join(', ')}`)
                .join(' | '),
            )
            .join('\n')
        : 'none'
    }`,
  ].join('\n\n');

  const out = await generateJSON({
    system: ROADMAP_SYSTEM_PROMPT.replace('<current semester>', String(ctx.semester)),
    user,
    schema: aiRoadmapOut,
    maxTokens: 1800,
  });

  const steps = out.steps
    .filter((s: any) => s.semester >= ctx.semester)
    .map((s: any) => ({ ...s, id: randomUUID() }));

  return { ...out, steps };
}

export { aiEnabled };
