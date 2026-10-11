import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { notFound, forbidden } from '../../lib/errors';
import { notifyMany } from '../../services/notify';
import { sendSafeguardingAlert } from '../../lib/mailer';
import type { ReportCreateInput } from '@crossroads/shared';

async function assertTargetExists(userId: string, targetType: ReportCreateInput['targetType'], targetId: string) {
  switch (targetType) {
    case 'POST':
      if (!(await prisma.post.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'COMMENT':
      if (!(await prisma.comment.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'EXPERIENCE':
      if (!(await prisma.experience.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'PROFILE':
      if (!(await prisma.user.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'TEAM':
      if (!(await prisma.team.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'STORY':
      if (!(await prisma.story.findUnique({ where: { id: targetId } }))) throw notFound('Target not found');
      return;
    case 'CONVERSATION': {
      // Only a participant can report a conversation — this also keeps strangers from probing thread ids
      const c = await prisma.conversation.findUnique({ where: { id: targetId }, select: { userAId: true, userBId: true } });
      if (!c) throw notFound('Target not found');
      if (c.userAId !== userId && c.userBId !== userId) throw forbidden('You are not part of this conversation');
      return;
    }
  }
}

export async function createReport(userId: string, input: ReportCreateInput) {
  const { targetType, targetId, reason, details } = input;
  await assertTargetExists(userId, targetType, targetId);

  const existing = await prisma.report.findFirst({ where: { reporterId: userId, targetType, targetId, status: 'OPEN' } });
  if (existing) return existing;

  const report = await prisma.report.create({ data: { reporterId: userId, targetType, targetId, reason, details, status: 'OPEN' } });

  if (reason === 'HARASSMENT') {
    // Safety reports are kept out of the general moderation queue and routed only to coordinators (phase-12 §5):
    // a harassment report never sits in the same queue, with the same urgency, as a flagged typo.
    const coordinators = await prisma.user.findMany({
      where: { isSafeguardingCoordinator: true, isSuspended: false },
      select: { id: true, email: true, fullName: true },
    });
    const reporter = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });

    await prisma.$transaction(async (tx) => {
      // Content-free: the notification never carries the reported text, only that a review is needed
      await notifyMany(tx, coordinators.map((c) => c.id), {
        type: 'SYSTEM',
        title: 'Safety report needs review',
        body: 'A harassment or safety report was filed. Open the safeguarding queue to review it.',
        link: '/admin/reports?category=safety',
      });
    });

    if (env.SAFEGUARDING_CONTACT_EMAIL) {
      await sendSafeguardingAlert(env.SAFEGUARDING_CONTACT_EMAIL, {
        reporterName: reporter.fullName,
        targetType,
        reportId: report.id,
      }).catch(() => undefined); // the in-app coordinator notification above must not depend on email delivery
    }
  } else {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        { type: 'SYSTEM', title: `New report: ${reason}`, body: 'A user reported content that needs review.', link: '/admin/reports' },
      );
    });
  }

  return report;
}
