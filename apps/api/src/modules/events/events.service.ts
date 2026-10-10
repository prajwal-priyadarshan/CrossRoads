import { prisma } from '../../lib/prisma';
import { DAY_MS, LIMITS } from '../../config/constants';

/** Events in the next 7 days for the viewer's year (alumni count as year 5). */
export async function thisWeek(viewer: { currentYear: number | null; role: string }) {
  const year = viewer.role === 'ALUMNI' ? 5 : (viewer.currentYear ?? 1);
  const now = new Date();
  return prisma.event.findMany({
    where: {
      startsAt: { gte: now, lte: new Date(now.getTime() + 7 * DAY_MS) },
      audienceYears: { has: year },
      category: { notIn: ['REUNION', 'CHAPTER_MEET'] }, // community events live on the Phase 11 events page
    },
    orderBy: { startsAt: 'asc' },
    take: LIMITS.WEEK_EVENTS,
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
