import { prisma } from '../../lib/prisma';
import { notFound, conflict } from '../../lib/errors';
import { notifyMany } from '../../services/notify';
import type { ReportCreateInput } from '@crossroads/shared';

export async function createReport(userId: string, input: ReportCreateInput) {
  const { targetType, targetId, reason, details } = input;
  
  // Verify target exists
  let targetExists = false;
  switch(targetType) {
    case 'POST': targetExists = !!await prisma.post.findUnique({ where: { id: targetId } }); break;
    case 'COMMENT': targetExists = !!await prisma.comment.findUnique({ where: { id: targetId } }); break;
    case 'EXPERIENCE': targetExists = !!await prisma.experience.findUnique({ where: { id: targetId } }); break;
    case 'PROFILE': targetExists = !!await prisma.user.findUnique({ where: { id: targetId } }); break;
    case 'TEAM': targetExists = !!await prisma.team.findUnique({ where: { id: targetId } }); break;
    case 'STORY': targetExists = !!await prisma.story.findUnique({ where: { id: targetId } }); break;
  }
  if (!targetExists) throw notFound('Target not found');

  const existing = await prisma.report.findFirst({
    where: { reporterId: userId, targetType, targetId, status: 'OPEN' }
  });
  if (existing) return existing;

  const report = await prisma.report.create({
    data: {
      reporterId: userId,
      targetType,
      targetId,
      reason,
      details,
      status: 'OPEN'
    }
  });

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    await notifyMany(tx, admins.map(a => a.id), {
      type: 'SYSTEM',
      title: `New report: ${reason}`,
      body: 'A user reported content that needs review.',
      link: '/admin/reports'
    });
  });

  return report;
}
