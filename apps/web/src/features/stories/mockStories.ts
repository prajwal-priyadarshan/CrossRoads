import type { StoryDetail, StoryPage, StorySummary } from '@crossroads/shared';

export const MOCK_STORIES: Array<StorySummary & { body: string }> = [
  {
    id: 'mock-story-1',
    slug: 'demo-from-campus-to-ml-engineer',
    title: 'From a first-year question to an ML offer',
    excerpt: 'How one question on this platform led to a mentor, a project and an internship.',
    body: 'Meera answered my first question in week two. Six months later we had built a small recommendation prototype together and I had a referral to Northwind Labs. The advice was simple: finish one project before starting five.\n\nWorking through edge cases with someone who had just been in my shoes gave me the confidence to handle technical interviews. Having a mentor didn\'t just teach me ML concepts—it showed me how engineers actually ship software.',
    coverUrl: '/mock/stories/story-1.svg',
    tags: ['ml', 'mentorship'],
    isSpotlight: true,
    status: 'PUBLISHED',
    publishedAt: '2026-10-06T07:43:42.520Z',
    createdAt: '2026-10-06T07:43:42.520Z',
    featuredUser: {
      id: 'mock-user-ananya',
      handle: 'ananya',
      fullName: 'Ananya Iyer',
      avatarUrl: null,
      role: 'STUDENT',
      currentYear: 1,
      department: 'CSE-AI',
      company: null,
      jobTitle: null,
      isVerified: false,
    },
  },
  {
    id: 'mock-story-2',
    slug: 'demo-placement-season-lessons',
    title: 'Placement season, one year later',
    excerpt: 'What I would do differently: more mock interviews, fewer applications.',
    body: 'I applied to sixty companies and heard back from six. The turning point was two mock interviews with a senior who asked the same follow-up questions the real panel did.\n\nInstead of spraying resumes everywhere, tailoring my pitch and deeply mastering core fundamentals changed the outcome entirely.',
    coverUrl: '/mock/stories/story-2.svg',
    tags: ['placements'],
    isSpotlight: false,
    status: 'PUBLISHED',
    publishedAt: '2026-09-29T07:43:42.785Z',
    createdAt: '2026-09-29T07:43:42.785Z',
    featuredUser: {
      id: 'mock-user-shreya',
      handle: 'shreya',
      fullName: 'Shreya Nambiar',
      avatarUrl: null,
      role: 'ALUMNI',
      currentYear: null,
      department: 'CSE',
      company: 'Microsoft',
      jobTitle: 'Software Engineer',
      isVerified: true,
    },
  },
  {
    id: 'mock-story-3',
    slug: 'demo-from-service-to-product-sde',
    title: 'From a service company offer to a product role',
    excerpt: 'Two years of DSA, one referral and a lot of mock interviews.',
    body: 'I joined a service company in my final year and nearly stopped there. What changed was a plan from a senior who had made the same jump.\n\nWe spent three months on arrays, graphs and dynamic programming, with one timed set every weekend. Mock interviews with two alumni showed me where I explained badly, not where I was weak.\n\nThe referral came from a mentee I had helped with a project. Preparation is slow, but it compounds.',
    coverUrl: '/mock/stories/story-3.svg',
    tags: ['placements', 'dsa'],
    isSpotlight: false,
    status: 'PUBLISHED',
    publishedAt: '2026-09-21T07:43:42.785Z',
    createdAt: '2026-09-21T07:43:42.785Z',
    featuredUser: {
      id: 'mock-user-aditya',
      handle: 'aditya',
      fullName: 'Aditya Menon',
      avatarUrl: null,
      role: 'STUDENT',
      currentYear: 4,
      department: 'ECE',
      company: null,
      jobTitle: null,
      isVerified: false,
    },
  },
  {
    id: 'mock-story-4',
    slug: 'demo-building-a-campus-startup',
    title: 'Building a campus startup before graduating',
    excerpt: 'A tutoring app, three pilot classes and the first thing I would change.',
    body: 'LearnLoop began as a notes-sharing sheet. Within a semester, forty students were using it for weekly tutoring.\n\nThe hardest part was not the product. It was finding a co-founder who wanted to ship every week, not every term. Being in a campus community made that search possible.\n\nIf I started again, I would validate with ten users before writing any code.',
    coverUrl: '/mock/stories/story-4.svg',
    tags: ['startups', 'mentorship'],
    isSpotlight: false,
    status: 'PUBLISHED',
    publishedAt: '2026-09-06T07:43:42.785Z',
    createdAt: '2026-09-06T07:43:42.785Z',
    featuredUser: {
      id: 'mock-user-anitha',
      handle: 'anitha',
      fullName: 'Anitha Raj',
      avatarUrl: null,
      role: 'ALUMNI',
      currentYear: null,
      department: 'CSE',
      company: 'LearnLoop',
      jobTitle: 'Founder',
      isVerified: true,
    },
  },
  {
    id: 'mock-story-5',
    slug: 'demo-research-year-to-ms-offer',
    title: 'A research year that led to an MS offer',
    excerpt: 'How one professor, one reading group and a small paper opened the door.',
    body: 'I was unsure whether an MS was worth it. A second-year research project with a professor in the signal processing lab answered that question for me.\n\nI read one paper a week with a reading group, then reproduced a result. The reproduction became a short workshop paper.\n\nThe statement of purpose was easier to write once I had something concrete to point to.',
    coverUrl: '/mock/stories/story-5.svg',
    tags: ['higher studies', 'research'],
    isSpotlight: false,
    status: 'PUBLISHED',
    publishedAt: '2026-08-22T07:43:42.785Z',
    createdAt: '2026-08-22T07:43:42.785Z',
    featuredUser: {
      id: 'mock-user-imran',
      handle: 'imran',
      fullName: 'Imran Khan',
      avatarUrl: null,
      role: 'ALUMNI',
      currentYear: null,
      department: 'ECE',
      company: 'CMU',
      jobTitle: 'Grad Student',
      isVerified: true,
    },
  },
  {
    id: 'mock-story-6',
    slug: 'demo-first-internship-in-finance',
    title: 'My first internship in quant finance',
    excerpt: 'Maths was the easy part. Explaining my thinking out loud was the skill I had to build.',
    body: 'The quant interviews focused on probability and on how I reasoned, not only on the answer. I practised by explaining my steps to a friend before writing anything down.\n\nThe internship taught me to write clean code under pressure and to ask questions early.\n\nIf you are preparing now, start with the explanation habit. It matters more than another hundred problems.',
    coverUrl: '/mock/stories/story-6.svg',
    tags: ['quant', 'internships'],
    isSpotlight: false,
    status: 'PUBLISHED',
    publishedAt: '2026-08-07T07:43:42.785Z',
    createdAt: '2026-08-07T07:43:42.785Z',
    featuredUser: {
      id: 'mock-user-vishal',
      handle: 'vishal',
      fullName: 'Vishal Reddy',
      avatarUrl: null,
      role: 'ALUMNI',
      currentYear: null,
      department: 'Mathematics & Computing',
      company: 'Tower Research',
      jobTitle: 'Quant Analyst',
      isVerified: true,
    },
  },
];

export function getMockStoryBySlug(slug: string): (StoryDetail & { story: StorySummary & { body: string } }) | undefined {
  const story = MOCK_STORIES.find((s) => s.slug === slug);
  if (!story) return undefined;

  const related = MOCK_STORIES.filter((s) => s.slug !== slug && s.tags.some((t) => story.tags.includes(t))).slice(0, 3);
  if (related.length === 0) {
    related.push(...MOCK_STORIES.filter((s) => s.slug !== slug).slice(0, 3));
  }

  return {
    ...story,
    story,
    related,
  };
}

export function getMockStoryPage(tag?: string): StoryPage {
  const filtered = tag ? MOCK_STORIES.filter((s) => s.tags.includes(tag)) : MOCK_STORIES;
  return {
    items: filtered,
    nextCursor: null,
  };
}
