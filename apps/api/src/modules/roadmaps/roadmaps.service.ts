import type { RoadmapCreateInput, RoadmapListQuery } from '@crossroads/shared';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { POINTS, awardPoints, evaluateBadges } from '../../services/gamification';
import { userLiteSelect } from '../users/users.serializers';

type StepJson = { id: string; title: string; detail?: string; semester: number; kind: string; resources?: string[] };
const asSteps = (v: unknown): StepJson[] => (Array.isArray(v) ? (v as StepJson[]) : []);

export async function listRoadmaps(viewerId: string, q: RoadmapListQuery) {
  const where: Prisma.RoadmapWhereInput = q.mine
    ? { OR: [{ authorId: viewerId }, { saves: { some: { userId: viewerId } } }] }
    : { isPublic: true, ...(q.goalTrack ? { goalTrack: q.goalTrack } : {}) };
  const rows = await prisma.roadmap.findMany({
    where,
    orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: userLiteSelect }, saves: { where: { userId: viewerId }, select: { completedSteps: true } } },
  });
  return rows.map((r) => {
    const steps = asSteps(r.steps);
    return {
      id: r.id,
      goalTrack: r.goalTrack,
      title: r.title,
      summary: r.summary,
      isAi: r.isAi,
      saveCount: r.saveCount,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
      stepCount: steps.length,
      saved: r.saves.length > 0,
      progress: r.saves[0] ? r.saves[0].completedSteps.length / Math.max(1, steps.length) : 0,
    };
  });
}

export async function getRoadmap(viewerId: string, id: string) {
  const r = await prisma.roadmap.findUnique({
    where: { id },
    include: { author: { select: userLiteSelect }, saves: { where: { userId: viewerId } } },
  });
  if (!r || (!r.isPublic && r.authorId !== viewerId)) throw notFound('Roadmap not found');
  const steps = asSteps(r.steps).map((s) => ({ ...s, detail: s.detail ?? '', resources: s.resources ?? [] }));
  const completedSteps = r.saves[0]?.completedSteps ?? [];
  const bm = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId: viewerId, targetType: 'ROADMAP', targetId: id } },
  });
  return {
    id: r.id,
    goalTrack: r.goalTrack,
    title: r.title,
    summary: r.summary,
    isAi: r.isAi,
    saveCount: r.saveCount,
    createdAt: r.createdAt.toISOString(),
    author: r.author,
    stepCount: steps.length,
    saved: r.saves.length > 0,
    progress: completedSteps.length / Math.max(1, steps.length),
    steps,
    mistakes: r.mistakes,
    gaps: Array.isArray(r.gaps) ? r.gaps : [],
    completedSteps,
    isAuthor: r.authorId === viewerId,
    bookmarked: !!bm,
  };
}

export async function createRoadmap(userId: string, input: RoadmapCreateInput) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.roadmap.create({ data: { ...input, authorId: userId, steps: input.steps } });
    const earned = await awardPoints(tx, userId, 'ROADMAP', POINTS.ROADMAP, r.id);
    await evaluateBadges(tx, userId);
    return { id: r.id, pointsEarned: earned ? POINTS.ROADMAP : 0 };
  });
}

async function assertVisible(viewerId: string, roadmapId: string) {
  const r = await prisma.roadmap.findUnique({ where: { id: roadmapId }, select: { isPublic: true, authorId: true } });
  if (!r || (!r.isPublic && r.authorId !== viewerId)) throw notFound('Roadmap not found');
}

export async function toggleSave(userId: string, roadmapId: string) {
  await assertVisible(userId, roadmapId);
  const key = { userId_roadmapId: { userId, roadmapId } };
  return prisma.$transaction(async (tx) => {
    const existing = await tx.roadmapSave.findUnique({ where: key });
    if (existing) {
      await tx.roadmapSave.delete({ where: key });
      const r = await tx.roadmap.update({ where: { id: roadmapId }, data: { saveCount: { decrement: 1 } } });
      return { saved: false, saveCount: r.saveCount };
    }
    await tx.roadmapSave.create({ data: { userId, roadmapId } });
    const r = await tx.roadmap.update({ where: { id: roadmapId }, data: { saveCount: { increment: 1 } } });
    return { saved: true, saveCount: r.saveCount };
  });
}

/** Ticking a step auto-saves the roadmap (and bumps saveCount the first time). */
export async function toggleStep(userId: string, roadmapId: string, stepId: string, done: boolean) {
  await assertVisible(userId, roadmapId);
  const key = { userId_roadmapId: { userId, roadmapId } };
  return prisma.$transaction(async (tx) => {
    let save = await tx.roadmapSave.findUnique({ where: key });
    if (!save) {
      save = await tx.roadmapSave.create({ data: { userId, roadmapId } });
      await tx.roadmap.update({ where: { id: roadmapId }, data: { saveCount: { increment: 1 } } });
    }
    const set = new Set(save.completedSteps);
    if (done) set.add(stepId);
    else set.delete(stepId);
    const updated = await tx.roadmapSave.update({ where: key, data: { completedSteps: [...set] } });
    return { completedSteps: updated.completedSteps, saved: true };
  });
}

export async function generateRoadmap(userId: string, input: { goalTrack: string; targetRole?: string; targetCompanySlugs?: string[] }) {
  const { gatherContext, deterministicRoadmap, aiRoadmap, computeGaps, aiEnabled } = await import('../../services/roadmapBuilder');
  const ctx = await gatherContext(userId, input);
  let out: Awaited<ReturnType<typeof deterministicRoadmap>>;
  let usedAI = false;
  if (aiEnabled) {
    try {
      out = await aiRoadmap(ctx, input.goalTrack);
      usedAI = true;
    } catch {
      out = deterministicRoadmap(ctx, input.goalTrack);
    }
  } else {
    out = deterministicRoadmap(ctx, input.goalTrack);
  }

  // Mark steps matching skills the user already has as completed
  const userSkills = new Set(ctx.user.skills.map((s) => s.toLowerCase()));
  const initialCompletedSteps = (out.steps as any[])
    .filter((s) => userSkills.has(s.title.toLowerCase()) || userSkills.has(s.title.replace(/^Learn /i, '').toLowerCase()))
    .map((s) => s.id);

  const sources = {
    roadmaps: ctx.roadmaps.map((r) => r.id),
    experiences: ctx.companies.flatMap((c) => c.experiences.map((e) => e.id)),
    journeys: ctx.twins.map((t: any) => t.id).filter(Boolean),
  };

  return prisma.$transaction(async (tx) => {
    const r = await tx.roadmap.create({
      data: {
        authorId: userId,
        goalTrack: input.goalTrack as any,
        title: out.title,
        summary: out.summary,
        steps: out.steps,
        isAi: usedAI,
        isPublic: false,
        gaps: out.gaps,
        sources,
      },
    });
    await tx.roadmapSave.create({
      data: { roadmapId: r.id, userId, completedSteps: initialCompletedSteps },
    });
    return { id: r.id, ...out, isAi: usedAI };
  });
}
