import { prisma } from '../../lib/prisma';
import { verifyPassword } from '../../lib/password';
import { unauthorized } from '../../lib/errors';

/** Everything the platform holds about one person, as readable JSON. The password hash is never included. */
export async function exportMyData(userId: string) {
  const [profile, posts, comments, connectionsSent, connectionsReceived, messages, rsvps, donations, ledger] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true, handle: true, fullName: true, role: true, department: true, batchYear: true, currentYear: true,
        company: true, jobTitle: true, bio: true, skills: true, interests: true, targetRoles: true, targetCompanies: true,
        canHelpWith: true, lookingFor: true, projects: true, achievements: true, linkedinUrl: true, githubUrl: true,
        points: true, consentAt: true, createdAt: true,
      },
    }),
    prisma.post.findMany({ where: { authorId: userId }, select: { kind: true, title: true, body: true, tags: true, createdAt: true } }),
    prisma.comment.findMany({ where: { authorId: userId }, select: { body: true, createdAt: true } }),
    prisma.connection.findMany({ where: { requesterId: userId }, select: { kind: true, topic: true, message: true, status: true, createdAt: true } }),
    prisma.connection.findMany({ where: { recipientId: userId }, select: { kind: true, topic: true, message: true, status: true, createdAt: true } }),
    prisma.message.findMany({ where: { senderId: userId }, select: { body: true, createdAt: true } }),
    prisma.eventRsvp.findMany({ where: { userId }, select: { code: true, createdAt: true, event: { select: { title: true, startsAt: true } } } }),
    prisma.donation.findMany({ where: { userId }, select: { receipt: true, amountPaise: true, anonymous: true, createdAt: true, campaign: { select: { title: true } } } }),
    prisma.pointsLedger.findMany({ where: { userId }, select: { action: true, points: true, createdAt: true } }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile,
    posts,
    comments,
    connections: { sent: connectionsSent, received: connectionsReceived },
    messagesSent: messages,
    eventTickets: rsvps,
    donations,
    pointsHistory: ledger,
  };
}

/**
 * Deletes the account and all personal data: profile, messages, connection requests, event tickets, points
 * history. Public contributions that other students rely on — questions, answers, interview experiences and
 * club reviews — are kept, with their author set to null (shown as "A deleted user"); removing them would
 * destroy value for everyone who has already read, bookmarked or built on them, per docs/phases/phase-12.md §6.
 * Enforced at the database level: those four tables' authorId foreign keys are ON DELETE SET NULL, everything
 * else (messages, team applications, votes, bookmarks, notifications, etc.) is ON DELETE CASCADE.
 */
export async function deleteMyAccount(userId: string, password: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  if (!(await verifyPassword(password, user.passwordHash))) throw unauthorized('That password is not right');
  await prisma.user.delete({ where: { id: userId } });
}
