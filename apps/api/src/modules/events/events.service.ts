import { randomBytes } from 'crypto';
import { conflict, notFound } from '../../lib/errors';
import { notify } from '../../services/notify';
import type { EventCard } from '@crossroads/shared';
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

// ── Upcoming events with RSVPs (phase 11) ──


const rsvpCode = () => randomBytes(5).toString('hex').toUpperCase();

function toCard(e: { id: string; title: string; description: string; category: string; startsAt: Date; endsAt: Date | null; location: string | null; link: string | null; region: string | null; capacity: number | null; pricePaise: number; rsvps: { userId: string; code: string }[] }, viewerId: string): EventCard {
  const mine = e.rsvps.find((r) => r.userId === viewerId) ?? null;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    location: e.location,
    link: e.link,
    region: e.region,
    capacity: e.capacity,
    pricePaise: e.pricePaise,
    rsvpCount: e.rsvps.length,
    seatsLeft: e.capacity == null ? null : Math.max(0, e.capacity - e.rsvps.length),
    mine: Boolean(mine),
    myCode: mine?.code ?? null,
  };
}

const rsvpsInclude = { rsvps: { select: { userId: true, code: true } } } as const;

export async function upcomingEvents(viewerId: string, region?: string): Promise<EventCard[]> {
  const rows = await prisma.event.findMany({
    where: { startsAt: { gte: new Date(Date.now() - 864e5) }, ...(region ? { region } : {}) },
    orderBy: { startsAt: 'asc' },
    take: 60,
    include: rsvpsInclude,
  });
  return rows.map((r) => toCard(r, viewerId));
}

export async function rsvpEvent(viewer: { id: string; fullName?: string }, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: rsvpsInclude });
  if (!event) throw notFound('Event not found');
  const existing = event.rsvps.find((r) => r.userId === viewer.id);
  if (existing) return toCard(event, viewer.id);
  if (event.capacity != null && event.rsvps.length >= event.capacity) throw conflict('This event is full');

  // Paid tickets are recorded in test mode until the college's payment gateway is connected
  await prisma.$transaction(async (tx) => {
    const row = await tx.eventRsvp.create({
      data: { eventId, userId: viewer.id, code: rsvpCode(), paidPaise: event.pricePaise },
    });
    await notify(tx, {
      userId: viewer.id,
      type: 'SYSTEM',
      title: `You are going: ${event.title}`,
      body: `Ticket code ${row.code}`,
      link: '/events',
    });
  });
  const fresh = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: rsvpsInclude });
  return toCard(fresh, viewer.id);
}

export async function cancelRsvp(viewerId: string, eventId: string) {
  await prisma.eventRsvp.deleteMany({ where: { eventId, userId: viewerId } });
  const fresh = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: rsvpsInclude });
  return toCard(fresh, viewerId);
}

export async function myTickets(viewerId: string): Promise<EventCard[]> {
  const rows = await prisma.event.findMany({
    where: { rsvps: { some: { userId: viewerId } }, startsAt: { gte: new Date(Date.now() - 864e5) } },
    orderBy: { startsAt: 'asc' },
    include: rsvpsInclude,
  });
  return rows.map((r) => toCard(r, viewerId));
}
