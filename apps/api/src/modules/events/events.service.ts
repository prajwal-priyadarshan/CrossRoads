import { prisma } from '../../lib/prisma';

/** Events in the next 7 days for the viewer's year (alumni count as year 5). */
export async function thisWeek(viewer: { currentYear: number | null; role: string }) {
  const year = viewer.role === 'ALUMNI' ? 5 : (viewer.currentYear ?? 1);
  const now = new Date();
  return prisma.event.findMany({
    where: {
      startsAt: { gte: now, lte: new Date(now.getTime() + 7 * 864e5) },
      audienceYears: { has: year },
      category: { notIn: ['REUNION', 'CHAPTER_MEET'] }, // community events live on the Phase 11 events page
    },
    orderBy: { startsAt: 'asc' },
    take: 8,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      startsAt: true,
      endsAt: true,
      link: true,
      location: true,
    },
  });
}
