import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { users } from './data/users';

const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'demo12345';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const topics = await prisma.topic.findMany({ select: { id: true, slug: true } });
  const topicId = new Map(topics.map((t) => [t.slug, t.id]));

  for (const u of users) {
    const inviteRole = u.role === 'ALUMNI' ? 'ALUMNI' : 'STUDENT';
    await prisma.allowedEmail.upsert({
      where: { email: u.email },
      update: { role: inviteRole },
      create: { email: u.email, role: inviteRole },
    });

    const { milestones = [], followTopics = [], projects = [], ...data } = u;
    const isVerified = u.role === 'SENIOR' || u.role === 'ALUMNI';
    const profile = {
      ...data,
      projects,
      onboarded: true,
      emailVerified: true,
      isVerified,
      consentAt: new Date(),
      showLinkedin: u.showLinkedin ?? true,
      showGithub: u.showGithub ?? true,
    };
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: profile,
      create: { ...profile, passwordHash },
    });

    // Keep points consistent with anything already earned (seed:content, demo activity)
    const earned = await prisma.pointsLedger.aggregate({ where: { userId: user.id }, _sum: { points: true } });
    await prisma.user.update({
      where: { id: user.id },
      data: { points: (u.points ?? 0) + (earned._sum.points ?? 0) },
    });

    await prisma.milestone.deleteMany({ where: { userId: user.id } });
    if (milestones.length) {
      await prisma.milestone.createMany({
        data: milestones.map((m) => ({ ...m, description: m.description ?? '', userId: user.id })),
      });
    }

    const ids = followTopics.map((s) => topicId.get(s)).filter((x): x is number => x !== undefined);
    await prisma.topicFollow.deleteMany({ where: { userId: user.id } });
    if (ids.length) {
      await prisma.topicFollow.createMany({
        data: ids.map((id) => ({ userId: user.id, topicId: id })),
        skipDuplicates: true,
      });
    }
    await prisma.alertSubscription.upsert({
      where: { userId: user.id },
      update: { topicIds: ids },
      create: { userId: user.id, topicIds: ids, opportunityTypes: ['INTERNSHIP', 'HACKATHON'] },
    });
  }

  // Admin should be demo-loginable
  await prisma.user.updateMany({ where: { handle: 'admin' }, data: { email: 'admin@demo.bridgeup' } });
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
