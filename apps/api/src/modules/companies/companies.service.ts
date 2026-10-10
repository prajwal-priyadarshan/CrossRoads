import type { CompanyRound, ExperienceFilter, PrepRoadmapItem } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { round1 } from '../../lib/collections';
import { discoverPeople } from '../people/people.service';
import { experienceInclude, toExperienceCard } from '../experiences/experiences.serializers';

async function bookmarkedExperienceIds(viewerId: string, ids: string[]) {
  const rows = await prisma.bookmark.findMany({
    where: { userId: viewerId, targetType: 'EXPERIENCE', targetId: { in: ids } },
    select: { targetId: true },
  });
  return new Set(rows.map((r) => r.targetId));
}

export async function listCompanies(q?: string) {
  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
    include: { _count: { select: { experiences: { where: { isRemoved: false } } } } },
  });
  // Alumni count: seniors/alumni whose company contains the company name (cheap at campus scale)
  const alumniCounts = await Promise.all(
    companies.map((c) =>
      prisma.user.count({
        where: { onboarded: true, role: { in: ['ALUMNI', 'SENIOR'] }, company: { contains: c.name, mode: 'insensitive' } },
      }),
    ),
  );
  return companies.map((c, i) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    roles: c.roles,
    visitMonth: c.visitMonth,
    experienceCount: c._count.experiences,
    alumniCount: alumniCounts[i]!,
  }));
}

export async function getCompany(slug: string, viewerId: string) {
  const [company, viewer] = await Promise.all([
    prisma.company.findUnique({ where: { slug } }),
    prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { skills: true, targetCompanies: true } }),
  ]);
  if (!company) throw notFound('Company not found');
  const have = company.skillsTested.filter((s) => viewer.skills.includes(s));
  const [latest, stats] = await Promise.all([
    prisma.experience.findMany({
      where: { companyId: company.id, isRemoved: false },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      take: 2,
      include: experienceInclude,
    }),
    prisma.experience.aggregate({
      where: { companyId: company.id, isRemoved: false },
      _avg: { difficulty: true, prepWeeks: true },
      _count: true,
    }),
  ]);
  const marked = await bookmarkedExperienceIds(viewerId, latest.map((e) => e.id));
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    description: company.description,
    website: company.website,
    roles: company.roles,
    rounds: (Array.isArray(company.rounds) ? company.rounds : []) as CompanyRound[],
    skillsTested: company.skillsTested,
    prepRoadmap: (Array.isArray(company.prepRoadmap) ? company.prepRoadmap : []) as PrepRoadmapItem[],
    visitMonth: company.visitMonth,
    skills: { tested: company.skillsTested, have, missing: company.skillsTested.filter((s) => !have.includes(s)) },
    isTarget: viewer.targetCompanies.includes(company.slug),
    stats: {
      experiences: stats._count,
      avgDifficulty: stats._avg.difficulty !== null ? round1(stats._avg.difficulty) : null,
      avgPrepWeeks: stats._avg.prepWeeks !== null ? Math.round(stats._avg.prepWeeks) : null,
    },
    latestExperiences: latest.map((e) => toExperienceCard(e, marked.has(e.id))),
  };
}

export async function listExperiences(slug: string, viewerId: string, f: ExperienceFilter) {
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) throw notFound('Company not found');
  const rows = await prisma.experience.findMany({
    where: {
      companyId: company.id,
      isRemoved: false,
      ...(f.year ? { year: f.year } : {}),
      ...(f.role ? { role: { contains: f.role, mode: 'insensitive' as const } } : {}),
      ...(f.minDifficulty ? { difficulty: { gte: f.minDifficulty } } : {}),
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: experienceInclude,
  });
  // Round type lives in JSON: filter in memory (small data)
  const filtered = rows.filter(
    (r) => !f.roundType || (Array.isArray(r.rounds) && (r.rounds as Array<{ type?: string }>).some((x) => x.type === f.roundType)),
  );
  const marked = await bookmarkedExperienceIds(viewerId, filtered.map((e) => e.id));
  return filtered.map((e) => toExperienceCard(e, marked.has(e.id)));
}

export async function companyAlumni(slug: string, viewerId: string) {
  const company = await prisma.company.findUnique({ where: { slug }, select: { name: true } });
  if (!company) throw notFound('Company not found');
  return discoverPeople(viewerId, {
    company: company.name,
    mode: 'all',
    sort: 'match',
    limit: 24,
    skills: [],
    interests: [],
    mentorAvailable: false,
  });
}
