import { prisma } from '../lib/prisma';

/** First-year quests are derived from real data each time; nothing is stored. */
export async function computeQuests(userId: string, visitedClubs = 0) {
  const [u, follows, questions, requests, saves, reviews] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { skills: true, bio: true } }),
    prisma.topicFollow.count({ where: { userId } }),
    prisma.post.count({ where: { authorId: userId, kind: 'QUESTION', isRemoved: false } }),
    prisma.connection.count({ where: { requesterId: userId } }),
    prisma.roadmapSave.count({ where: { userId } }),
    prisma.clubReview.count({ where: { authorId: userId } }),
  ]);
  const items = [
    { id: 'profile', label: 'Complete your profile', hint: '3+ skills and a short bio', done: u.skills.length >= 3 && u.bio.length >= 20, href: '/settings/profile' },
    { id: 'topics', label: 'Follow 3 topics', hint: 'Personalise your feed', done: follows >= 3, href: '/community' },
    { id: 'ask', label: 'Ask your first question', hint: 'Seniors are happy to help', done: questions >= 1, href: '/ask/new' },
    { id: 'clubs', label: 'Explore 3 clubs', hint: 'See honest reviews from seniors', done: visitedClubs >= 3 || reviews >= 1, href: '/clubs' },
    { id: 'request', label: 'Reach out to someone', hint: 'Send your first request', done: requests >= 1, href: '/people' },
    { id: 'roadmap', label: 'Save a roadmap', hint: 'Know what to do next', done: saves >= 1, href: '/roadmaps' },
  ];
  return { items, done: items.filter((q) => q.done).length, total: items.length };
}

/** Seniors and alumni see actionable ways to help instead of quests. */
export async function computeWaysToHelp(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { skills: true } });
  const [unanswered, pending, myReviews, clubs, hasJourneyJob, experiences] = await Promise.all([
    u.skills.length
      ? prisma.post.count({
          where: { kind: 'QUESTION', isRemoved: false, commentCount: 0, authorId: { not: userId }, tags: { hasSome: u.skills } },
        })
      : Promise.resolve(0),
    prisma.connection.count({ where: { recipientId: userId, status: 'PENDING' } }),
    prisma.clubReview.count({ where: { authorId: userId } }),
    prisma.club.count(),
    prisma.milestone.count({ where: { userId, category: { in: ['JOB', 'INTERNSHIP'] } } }),
    prisma.experience.count({ where: { authorId: userId } }),
  ]);
  return [
    {
      id: 'answer',
      label: `${unanswered} unanswered question${unanswered === 1 ? '' : 's'} in your skills`,
      href: '/ask',
      count: unanswered,
      show: unanswered > 0,
    },
    { id: 'requests', label: `${pending} pending request${pending === 1 ? '' : 's'}`, href: '/requests', count: pending, show: pending > 0 },
    { id: 'clubs', label: 'Review the clubs you were part of', href: '/clubs', show: myReviews < Math.min(3, clubs) },
    {
      id: 'experience',
      label: 'Share an interview experience',
      href: '/experiences/new',
      show: hasJourneyJob > 0 && experiences === 0,
    },
  ]
    .filter((w) => w.show)
    .map(({ show: _show, ...w }) => w);
}
