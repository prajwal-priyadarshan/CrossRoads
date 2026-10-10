import { clubReviewSchema, experienceCreateSchema, roadmapCreateSchema } from '@bridgeup/shared';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { createExperience } from '../src/modules/experiences/experiences.service';
import { reviewClub } from '../src/modules/clubs/clubs.service';
import { createRoadmap } from '../src/modules/roadmaps/roadmaps.service';
import { clubReviews, experiences, roadmaps } from './data/content';

const DEMO = { endsWith: env.DEMO_EMAIL_SUFFIX };

/** Removes previous seed content by demo authors and takes back the points it earned, so re-runs are idempotent. */
async function clearPrevious() {
  const demoUsers = { author: { email: DEMO } };
  const [exps, reviews, maps] = await Promise.all([
    prisma.experience.findMany({ where: demoUsers, select: { id: true } }),
    prisma.clubReview.findMany({ where: demoUsers, select: { id: true } }),
    prisma.roadmap.findMany({ where: { ...demoUsers, isAi: false }, select: { id: true } }),
  ]);
  const refIds = [...exps, ...reviews, ...maps].map((x) => x.id);
  const ledger = await prisma.pointsLedger.findMany({
    where: { refId: { in: refIds }, action: { in: ['EXPERIENCE', 'CLUB_REVIEW', 'ROADMAP'] } },
  });
  await prisma.$transaction(async (tx) => {
    for (const l of ledger) await tx.user.update({ where: { id: l.userId }, data: { points: { decrement: l.points } } });
    await tx.pointsLedger.deleteMany({ where: { id: { in: ledger.map((l) => l.id) } } });
    await tx.bookmark.deleteMany({ where: { targetId: { in: refIds } } });
    await tx.experience.deleteMany({ where: { id: { in: exps.map((e) => e.id) } } });
    await tx.clubReview.deleteMany({ where: { id: { in: reviews.map((r) => r.id) } } });
    await tx.roadmap.deleteMany({ where: { id: { in: maps.map((m) => m.id) } } });
  });
  console.log(`Cleared ${exps.length} experiences, ${reviews.length} reviews, ${maps.length} roadmaps`);
}

async function main() {
  await clearPrevious();

  const users = await prisma.user.findMany({ where: { email: DEMO }, select: { id: true, handle: true } });
  const userId = (handle: string) => {
    const u = users.find((x) => x.handle === handle);
    if (!u) throw new Error(`Demo user "${handle}" missing. Run npm run seed:users first.`);
    return u.id;
  };
  const companies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const companyId = (slug: string) => {
    const c = companies.find((x) => x.slug === slug);
    if (!c) throw new Error(`Company "${slug}" missing. Run npm run db:seed first.`);
    return c.id;
  };

  // Through the service functions so points and badges are awarded consistently
  for (const e of experiences) {
    const input = experienceCreateSchema.parse({
      companyId: companyId(e.company),
      role: e.role,
      year: e.year,
      rounds: e.rounds,
      difficulty: e.difficulty,
      prepWeeks: e.prepWeeks,
      resources: e.resources,
      tips: e.tips,
      outcome: e.outcome,
      confidentialityAck: true,
    });
    const { id } = await createExperience(userId(e.author), input);
    if (e.verified) await prisma.experience.update({ where: { id }, data: { isVerified: true } });
  }

  for (const r of clubReviews) {
    await reviewClub(userId(r.author), r.club, clubReviewSchema.parse(r));
  }

  for (const m of roadmaps) {
    await createRoadmap(userId(m.author), roadmapCreateSchema.parse(m));
  }

  console.log(`Seeded ${experiences.length} experiences, ${clubReviews.length} club reviews, ${roadmaps.length} roadmaps`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
