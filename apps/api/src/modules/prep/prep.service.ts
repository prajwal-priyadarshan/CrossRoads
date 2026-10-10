import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { readinessFor } from '../../services/readiness';

const prepItemsOf = (c: { prepRoadmap: unknown }) =>
  z
    .array(z.object({ title: z.string(), detail: z.string().default(''), category: z.string().default('TECHNICAL') }))
    .catch([])
    .parse(c.prepRoadmap);

export async function getDashboard(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      prepItems: true,
      simSessions: {
        where: { status: 'FINISHED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { company: { select: { name: true, slug: true } } },
      },
    },
  });

  const companies = user.targetCompanies.length
    ? await prisma.company.findMany({ where: { slug: { in: user.targetCompanies } } })
    : [];

  const readiness = await Promise.all(
    companies.map(async (c) => {
      const latestSim = await prisma.simSession.findFirst({
        where: { userId, companyId: c.id, status: 'FINISHED' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, total: true },
      });
      const simAvg = latestSim && latestSim.total > 0 ? (latestSim.score / latestSim.total) * 100 : undefined;
      const r = readinessFor(user, c, user.prepItems, simAvg);
      const missing = c.skillsTested.filter((s) => !user.skills.includes(s)).slice(0, 4);
      return { companyId: c.id, companyName: c.name, companySlug: c.slug, ...r, missing, latestSimScore: latestSim };
    }),
  );

  const tracks = (['OA', 'APTITUDE', 'TECHNICAL', 'HR'] as const).map((cat) => {
    const items = user.prepItems.filter((i) => i.category === cat);
    return {
      category: cat,
      total: items.length,
      done: items.filter((i) => i.done).length,
      items: items.map((i) => ({ id: i.id, title: i.title, done: i.done, companyId: i.companyId, source: i.source })),
    };
  });

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [events, bookmarkedOpportunities] = await Promise.all([
    prisma.event.findMany({
      where: {
        category: { in: ['PLACEMENT', 'DEADLINE'] },
        startsAt: { gte: now, lte: in30 },
        ...(user.currentYear ? { audienceYears: { has: user.currentYear } } : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: 10,
    }),
    prisma.bookmark.findMany({
      where: { userId, targetType: 'POST' },
      select: { targetId: true },
    }).then(async (bms) => {
      if (!bms.length) return [];
      return prisma.post.findMany({
        where: {
          id: { in: bms.map((b) => b.targetId) },
          kind: 'OPPORTUNITY',
          deadline: { gte: now, lte: in30 },
          isRemoved: false,
        },
        select: { id: true, title: true, deadline: true },
        orderBy: { deadline: 'asc' },
        take: 5,
      });
    }),
  ]);

  const deadlines = [
    ...events.map((e) => ({ id: e.id, title: e.title, date: e.startsAt, type: 'event' as const, category: e.category })),
    ...bookmarkedOpportunities.map((o) => ({ id: o.id, title: o.title, date: o.deadline!, type: 'opportunity' as const })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextActions: Array<{ label: string; reason: string; href: string; kind: string }> = [];
  if (!companies.length) {
    nextActions.push({ label: 'Add target companies', reason: 'Set your targets to see readiness scores', href: '/prep', kind: 'SETUP' });
  } else {
    const lowReadiness = readiness.find((r) => r.score < 30);
    if (lowReadiness) {
      nextActions.push({ label: `Practice ${lowReadiness.companyName} aptitude`, reason: `Readiness is ${lowReadiness.score}% — practice helps`, href: `/prep/simulator`, kind: 'PRACTICE' });
    }
  }
  for (const track of tracks) {
    if (track.items.some((i) => !i.done)) {
      nextActions.push({ label: `Complete your ${track.category} checklist`, reason: `${track.done}/${track.total} tasks done`, href: '/prep', kind: 'CHECKLIST' });
      if (nextActions.length >= 4) break;
    }
  }
  if ((user.currentYear ?? 1) <= 2) {
    nextActions.push({ label: 'Build a project', reason: 'Projects are key at this stage', href: '/roadmaps/generate', kind: 'PROJECT' });
  }
  if (!user.simSessions.length) {
    nextActions.push({ label: 'Take a simulation', reason: 'Practice with real-style questions', href: '/prep/simulator', kind: 'SIM' });
  }

  const stageCopy =
    !user.currentYear
      ? 'Help juniors prepare — share your experiences'
      : user.currentYear <= 1
        ? 'Focus on foundations — DSA basics, a first project and a club'
        : user.currentYear <= 2
          ? 'Build projects and aim for an internship'
          : 'Company-specific prep and practice — you are in the home stretch';

  const recentSims = user.simSessions.map((s) => ({
    id: s.id,
    companyName: s.company.name,
    companySlug: s.company.slug,
    roundType: s.roundType,
    score: s.score,
    total: s.total,
    date: s.createdAt,
  }));

  return {
    targets: { companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug })), roles: user.targetRoles },
    readiness,
    tracks,
    deadlines,
    nextActions: nextActions.slice(0, 5),
    stageCopy,
    recentSims,
  };
}

export async function createPrepItem(userId: string, input: { category: 'OA' | 'APTITUDE' | 'TECHNICAL' | 'HR'; title: string; companyId?: string }) {
  return prisma.prepItem.create({ data: { userId, ...input } });
}

export async function updatePrepItem(userId: string, id: string, input: { done?: boolean; title?: string }) {
  const item = await prisma.prepItem.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Item not found');
  if (item.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your prep item');
  return prisma.prepItem.update({ where: { id }, data: input });
}

export async function deletePrepItem(userId: string, id: string) {
  const item = await prisma.prepItem.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Item not found');
  if (item.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Not your prep item');
  await prisma.prepItem.delete({ where: { id } });
}

export async function importPrepItems(userId: string, companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

  const companyItems = z
    .array(z.object({ title: z.string(), detail: z.string().default(''), category: z.string().default('TECHNICAL') }))
    .catch([])
    .parse(company.prepRoadmap);

  const existing = await prisma.prepItem.findMany({ where: { userId, companyId } });
  const existingTitles = new Set(existing.map((i) => i.title.toLowerCase()));

  const toCreate = companyItems
    .filter((item) => !existingTitles.has(item.title.toLowerCase()))
    .map((item) => ({
      userId,
      companyId,
      category: (['OA', 'APTITUDE', 'TECHNICAL', 'HR'].includes(item.category) ? item.category : 'TECHNICAL') as 'OA' | 'APTITUDE' | 'TECHNICAL' | 'HR',
      title: item.title,
      source: 'company',
    }));

  if (toCreate.length) {
    await prisma.prepItem.createMany({ data: toCreate });
  }
  return { created: toCreate.length };
}
