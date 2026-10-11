import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { TOPICS, BADGES } from '@crossroads/shared';
import { companies } from './data/companies';
import { clubs } from './data/clubs';
import { events } from './data/events';

async function main() {
  for (const t of TOPICS) {
    const data = { name: t.name, description: t.description, icon: t.icon };
    await prisma.topic.upsert({ where: { slug: t.slug }, update: data, create: { slug: t.slug, ...data } });
  }
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { slug: b.slug }, update: { ...b }, create: { ...b } });
  }
  for (const c of companies) {
    await prisma.company.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const c of clubs) {
    await prisma.club.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  // Clubs removed from data/clubs.ts are deleted; ClubReview cascades.
  await prisma.club.deleteMany({ where: { slug: { notIn: clubs.map((c) => c.slug) } } });

  // Events are time-relative: replace them on every seed
  await prisma.event.deleteMany({
    where: { category: { in: ['CLUB', 'EXAM', 'HACKATHON', 'PLACEMENT', 'DEADLINE', 'EVENT', 'WEBINAR'] } },
  });
  await prisma.event.createMany({
    data: events.map((e) => ({
      title: e.title,
      category: e.category,
      startsAt: e.startsAt,
      ...('link' in e ? { link: e.link } : {}),
      ...('audienceYears' in e ? { audienceYears: [...e.audienceYears] } : {}),
    })),
  });

  // Admin account (password from env so it's never committed)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || `admin${env.DEMO_EMAIL_SUFFIX}`;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      emailVerified: true,
      handle: 'admin',
      fullName: 'Student Council Admin',
      role: 'ADMIN',
      onboarded: true,
      isVerified: true,
    },
  });

  // Alumni invite allowlist (alumni may register with a non-college email if listed here)
  await prisma.allowedEmail.upsert({
    where: { email: `alumni${env.DEMO_EMAIL_SUFFIX}` },
    update: {},
    create: { email: `alumni${env.DEMO_EMAIL_SUFFIX}`, role: 'ALUMNI' },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
