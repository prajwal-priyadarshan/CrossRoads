import type { SearchGroup, SearchHit, SearchQuery } from '@crossroads/shared';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { titleCase } from '../../lib/text';

// All user input goes through tagged templates (parameterised). Dynamic parts use Prisma.sql / Prisma.empty.

/** ILIKE pattern with % and _ escaped so they match literally. */
const like = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

const ROLE = { STUDENT: 'Student', SENIOR: 'Senior', ALUMNI: 'Alumni', ADMIN: 'Admin' } as const;

async function searchPosts(kind: 'QUESTION' | 'DISCUSSION' | 'OPPORTUNITY', q: SearchQuery, limit: number) {
  const doc = Prisma.sql`to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.body,''))`;
  const query = Prisma.sql`websearch_to_tsquery('english', ${q.q})`;
  const topic = q.topic ? Prisma.sql`AND t.slug = ${q.topic}` : Prisma.empty;
  const dept = q.department ? Prisma.sql`AND u.department = ${q.department}` : Prisma.empty;
  const batch = q.batch ? Prisma.sql`AND u."batchYear" = ${q.batch}` : Prisma.empty;
  const rows = await prisma.$queryRaw<
    Array<{ id: string; title: string; commentCount: number; topic: string | null; author: string; organization: string | null }>
  >`
    SELECT p.id, p.title, p."commentCount", t.name AS topic, u."fullName" AS author, p.organization
    FROM "Post" p
    JOIN "User" u ON u.id = p."authorId"
    LEFT JOIN "Topic" t ON t.id = p."topicId"
    WHERE p."isRemoved" = false AND p.kind = ${kind}::"PostKind"
      AND (${doc} @@ ${query} OR p.title ILIKE ${like(q.q)} OR ${q.q.toLowerCase()} = ANY(p.tags))
      ${topic} ${dept} ${batch}
    ORDER BY ts_rank(${doc}, ${query}) DESC, p."createdAt" DESC
    LIMIT ${limit}`;
  return rows.map<SearchHit>((r) => ({
    id: r.id,
    title: r.title,
    subtitle:
      kind === 'QUESTION'
        ? `${r.commentCount} answer${r.commentCount === 1 ? '' : 's'}${r.topic ? ` · ${r.topic}` : ''}`
        : [r.organization, r.topic, `by ${r.author}`].filter(Boolean).join(' · '),
    url: kind === 'QUESTION' ? `/ask/${r.id}` : `/post/${r.id}`,
  }));
}

async function searchExperiences(q: SearchQuery, limit: number) {
  const doc = Prisma.sql`to_tsvector('english', coalesce(e.role,'') || ' ' || coalesce(e.tips,'') || ' ' || e.rounds::text)`;
  const company = q.company ? Prisma.sql`AND c.slug = ${q.company}` : Prisma.empty;
  const rows = await prisma.$queryRaw<Array<{ id: string; role: string; year: number; name: string; slug: string }>>`
    SELECT e.id, e.role, e.year, c.name, c.slug
    FROM "Experience" e JOIN "Company" c ON c.id = e."companyId"
    WHERE e."isRemoved" = false
      AND (${doc} @@ websearch_to_tsquery('english', ${q.q}) OR c.name ILIKE ${like(q.q)} OR e.role ILIKE ${like(q.q)})
      ${company}
    ORDER BY e.year DESC, e."createdAt" DESC
    LIMIT ${limit}`;
  return rows.map<SearchHit>((r) => ({
    id: r.id,
    title: `${r.name}: ${titleCase(r.role)}`,
    subtitle: `Interview experience · ${r.year}`,
    url: `/companies/${r.slug}#exp-${r.id}`,
  }));
}

async function searchTeams(q: SearchQuery, limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string; title: string; kind: string; rolesNeeded: string[] }>>`
    SELECT id, title, kind, "rolesNeeded"
    FROM "Team"
    WHERE status = 'OPEN' AND "isRemoved" = false
      AND (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ websearch_to_tsquery('english', ${q.q})
           OR title ILIKE ${like(q.q)})
    ORDER BY "createdAt" DESC
    LIMIT ${limit}`;
  return rows.map<SearchHit>((r) => ({
    id: r.id,
    title: r.title,
    subtitle: `${titleCase(r.kind.toLowerCase().replace(/_/g, ' '))}${r.rolesNeeded.length ? ` · needs ${r.rolesNeeded.slice(0, 2).join(', ')}` : ''}`,
    url: `/teams/${r.id}`,
  }));
}

async function searchPeople(q: SearchQuery, limit: number) {
  const companyName = q.company
    ? (await prisma.company.findUnique({ where: { slug: q.company }, select: { name: true } }))?.name
    : undefined;
  const rows = await prisma.user.findMany({
    where: {
      onboarded: true,
      role: { not: 'ADMIN' },
      ...(q.department ? { department: q.department } : {}),
      ...(q.batch ? { batchYear: q.batch } : {}),
      ...(companyName ? { company: { contains: companyName, mode: 'insensitive' as const } } : {}),
      OR: [
        { fullName: { contains: q.q, mode: 'insensitive' } },
        { company: { contains: q.q, mode: 'insensitive' } },
        { jobTitle: { contains: q.q, mode: 'insensitive' } },
        { bio: { contains: q.q, mode: 'insensitive' } },
        { skills: { has: q.q.toLowerCase() } },
      ],
    },
    orderBy: { points: 'desc' },
    take: limit,
    select: { handle: true, fullName: true, role: true, department: true, company: true, jobTitle: true, currentYear: true },
  });
  return rows.map<SearchHit>((u) => ({
    id: u.handle,
    title: u.fullName,
    subtitle: [
      ROLE[u.role],
      u.jobTitle && u.company ? `${u.jobTitle} @ ${u.company}` : u.department,
    ]
      .filter(Boolean)
      .join(' · '),
    url: `/u/${u.handle}`,
  }));
}

async function searchCompanies(q: SearchQuery, limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string; slug: string; name: string; description: string; roles: string[] }>>`
    SELECT id, slug, name, description, roles
    FROM "Company"
    WHERE similarity(name, ${q.q}) > 0.2 OR name ILIKE ${like(q.q)} OR ${q.q.toLowerCase()} = ANY("skillsTested")
    ORDER BY similarity(name, ${q.q}) DESC
    LIMIT ${limit}`;
  return rows.map<SearchHit>((c) => ({
    id: c.id,
    title: c.name,
    subtitle: c.roles.length ? `Hires for ${c.roles.slice(0, 2).map((r) => titleCase(r)).join(', ')}` : c.description.slice(0, 80),
    url: `/companies/${c.slug}`,
  }));
}

async function searchStories(q: SearchQuery, limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string; slug: string; title: string; excerpt: string }>>`
    SELECT id, slug, title, excerpt
    FROM "Story"
    WHERE status = 'PUBLISHED' AND "isRemoved" = false
      AND (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body,'')) @@ websearch_to_tsquery('english', ${q.q})
           OR title ILIKE ${like(q.q)})
    ORDER BY "publishedAt" DESC NULLS LAST
    LIMIT ${limit}`;
  return rows.map<SearchHit>((s) => ({ id: s.id, title: s.title, subtitle: s.excerpt.slice(0, 100), url: `/stories/${s.slug}` }));
}

const EMPTY: Record<SearchGroup, SearchHit[]> = {
  questions: [],
  posts: [],
  opportunities: [],
  experiences: [],
  teams: [],
  people: [],
  companies: [],
  stories: [],
};

/** One query per type (only the requested type when type ≠ all), run in parallel. */
export async function search(q: SearchQuery) {
  const want = (t: SearchQuery['type']) => q.type === 'all' || q.type === t;
  const limit = q.type === 'all' ? q.limit : Math.max(q.limit, 20);
  const none = Promise.resolve<SearchHit[]>([]);
  const [questions, posts, opportunities, experiences, teams, people, companies, stories] = await Promise.all([
    want('question') ? searchPosts('QUESTION', q, limit) : none,
    want('post') ? searchPosts('DISCUSSION', q, limit) : none,
    want('opportunity') ? searchPosts('OPPORTUNITY', q, limit) : none,
    want('experience') ? searchExperiences(q, limit) : none,
    want('team') ? searchTeams(q, limit) : none,
    want('person') ? searchPeople(q, limit) : none,
    want('company') ? searchCompanies(q, limit) : none,
    want('story') ? searchStories(q, limit) : none,
  ]);
  return { ...EMPTY, questions, posts, opportunities, experiences, teams, people, companies, stories };
}
