import { prisma } from '../../lib/prisma';
import { notFound, conflict } from '../../lib/errors';
import { notifyMany, notify } from '../../services/notify';
import { grantBadge } from '../../services/gamification';
import type { Prisma } from '../../generated/prisma/client';

/**
 * `viewer`: a plain ADMIN never sees HARASSMENT reports or conversation content (phase-12 §5) — the safety
 * queue is restricted to coordinators specifically. A coordinator sees both the general and safety queues.
 */
export async function adminGetReports(viewer: { isSafeguardingCoordinator: boolean }, status?: string) {
  const reports = await prisma.report.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(viewer.isSafeguardingCoordinator ? {} : { reason: { not: 'HARASSMENT' } }),
    },
    include: { reporter: { select: { id: true, handle: true, fullName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch targets manually
  const withTargets = await Promise.all(reports.map(async (r) => {
    let targetPreview = null;
    try {
      switch (r.targetType) {
        case 'POST': {
          const p = await prisma.post.findUnique({ where: { id: r.targetId }, include: { author: true } });
          if (p) targetPreview = { title: p.title, excerpt: p.body.substring(0, 100), author: p.author?.fullName ?? 'A deleted user' };
          break;
        }
        case 'COMMENT': {
          const c = await prisma.comment.findUnique({ where: { id: r.targetId }, include: { author: true } });
          if (c) targetPreview = { body: c.body.substring(0, 100), author: c.author?.fullName ?? 'A deleted user' };
          break;
        }
        case 'EXPERIENCE': {
          const e = await prisma.experience.findUnique({ where: { id: r.targetId }, include: { author: true, company: true } });
          if (e) targetPreview = { title: `${e.role} at ${e.company.name}`, author: e.author?.fullName ?? 'A deleted user' };
          break;
        }
        case 'PROFILE': {
          const u = await prisma.user.findUnique({ where: { id: r.targetId } });
          if (u) targetPreview = { name: u.fullName, handle: u.handle };
          break;
        }
        case 'TEAM': {
          const t = await prisma.team.findUnique({ where: { id: r.targetId } });
          if (t) targetPreview = { title: t.title };
          break;
        }
        case 'STORY': {
          const s = await prisma.story.findUnique({ where: { id: r.targetId } });
          if (s) targetPreview = { title: s.title };
          break;
        }
        case 'CONVERSATION': {
          // Private message content — never exposed to a non-coordinator, since this branch is unreachable
          // for them (HARASSMENT reports are excluded above), but the guard stays explicit rather than implied.
          if (!viewer.isSafeguardingCoordinator) break;
          const convo = await prisma.conversation.findUnique({
            where: { id: r.targetId },
            include: { userA: { select: { fullName: true, handle: true } }, userB: { select: { fullName: true, handle: true } } },
          });
          if (!convo) break;
          const messages = await prisma.message.findMany({
            where: { conversationId: r.targetId },
            orderBy: { createdAt: 'asc' },
            take: 100,
            include: { sender: { select: { fullName: true } } },
          });
          targetPreview = {
            participants: [convo.userA.fullName, convo.userB.fullName],
            messages: messages.map((m) => ({ from: m.sender.fullName, body: m.body, at: m.createdAt })),
          };
          break;
        }
      }
    } catch (e) {
      // Target may have been deleted
    }
    return { ...r, targetPreview };
  }));

  return withTargets;
}

export async function adminResolveReport(viewer: { isSafeguardingCoordinator: boolean }, id: string, action: 'REMOVE' | 'DISMISS') {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw notFound('Report not found');
  // Resolving is part of review; a non-coordinator must not be able to act on a safety report even by id
  if (report.reason === 'HARASSMENT' && !viewer.isSafeguardingCoordinator) throw notFound('Report not found');

  return prisma.$transaction(async (tx) => {
    if (action === 'REMOVE') {
      switch (report.targetType) {
        case 'POST': await tx.post.updateMany({ where: { id: report.targetId }, data: { isRemoved: true } }); break;
        case 'COMMENT': await tx.comment.updateMany({ where: { id: report.targetId }, data: { isRemoved: true } }); break;
        case 'EXPERIENCE': await tx.experience.updateMany({ where: { id: report.targetId }, data: { isRemoved: true } }); break;
        case 'PROFILE': await tx.user.updateMany({ where: { id: report.targetId }, data: { isSuspended: true } }); break;
        case 'TEAM': await tx.team.updateMany({ where: { id: report.targetId }, data: { isRemoved: true } }); break;
        case 'STORY': await tx.story.updateMany({ where: { id: report.targetId }, data: { isRemoved: true } }); break;
      }
      await tx.report.updateMany({
        where: { targetType: report.targetType, targetId: report.targetId, status: 'OPEN' },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });
    } else {
      await tx.report.update({ where: { id }, data: { status: 'DISMISSED', resolvedAt: new Date() } });
    }

    await notify(tx, {
      userId: report.reporterId,
      type: 'SYSTEM',
      title: 'Report updated',
      body: 'Thanks — we reviewed your report.',
      link: '/'
    });

    return { success: true };
  });
}

export async function adminGetUsers(q?: string, role?: string) {
  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as any } : {}),
    ...(q ? {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { handle: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    } : {})
  };
  return prisma.user.findMany({
    where,
    select: { id: true, fullName: true, handle: true, email: true, role: true, currentYear: true, isVerified: true, isSafeguardingCoordinator: true, points: true, createdAt: true, avatarUrl: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function adminUpdateUser(id: string, data: { isVerified?: boolean; role?: any; isSafeguardingCoordinator?: boolean }) {
  // Never return the full row here — it includes passwordHash, and this endpoint has no serializer between it and res.json
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, fullName: true, handle: true, email: true, role: true, isVerified: true, isSafeguardingCoordinator: true },
  });
}

export async function adminAllowlistEmail(email: string, role: 'ALUMNI' | 'STUDENT') {
  return prisma.allowedEmail.upsert({
    where: { email },
    update: { role },
    create: { email, role }
  });
}

export async function adminUpsertEvent(id: string | null, data: any) {
  if (id) {
    return prisma.event.update({ where: { id }, data });
  }
  return prisma.event.create({ data });
}

export async function adminDeleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}

export async function adminGetEvents() {
  return prisma.event.findMany({ orderBy: { startsAt: 'desc' } });
}

export async function adminGetCompanies() {
  return prisma.company.findMany({ orderBy: { name: 'asc' } });
}

export async function adminUpsertCompany(id: string | null, data: any) {
  if (id) {
    return prisma.company.update({ where: { id }, data });
  }
  return prisma.company.create({ data });
}

export async function adminGetClubs() {
  return prisma.club.findMany({ orderBy: { name: 'asc' } });
}

export async function adminUpsertClub(id: string | null, data: any) {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (id) {
    return prisma.club.update({ where: { id }, data });
  }
  return prisma.club.create({ data: { ...data, slug } });
}

export async function adminGetStories() {
  return prisma.story.findMany({
    orderBy: { createdAt: 'desc' },
    include: { featuredUser: { select: { id: true, fullName: true, handle: true, avatarUrl: true } } }
  });
}

export async function adminUpsertStory(id: string | null, data: any) {
  if (!data.slug) {
    data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  return prisma.$transaction(async (tx) => {
    if (data.isSpotlight) {
      await tx.story.updateMany({ where: { isSpotlight: true }, data: { isSpotlight: false } });
    }
    const isPublishing = data.status === 'PUBLISHED';
    const publishData = isPublishing ? { publishedAt: new Date() } : {};
    
    let story;
    if (id) {
      story = await tx.story.update({ where: { id }, data: { ...data, ...publishData } });
    } else {
      story = await tx.story.create({ data: { ...data, ...publishData } });
    }

    if (isPublishing && story.featuredUserId) {
      await grantBadge(tx, story.featuredUserId, 'spotlight');
      await notify(tx, {
        userId: story.featuredUserId,
        type: 'SYSTEM',
        title: "You're featured in a success story!",
        body: 'Check out the spotlight.',
        link: `/stories/${story.slug}`
      });
    }

    return story;
  });
}

export async function adminGetExperiences() {
  return prisma.experience.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, fullName: true, handle: true, avatarUrl: true } } },
    take: 100
  });
}

export async function adminVerifyExperience(id: string, isVerified: boolean) {
  return prisma.experience.update({ where: { id }, data: { isVerified } });
}
