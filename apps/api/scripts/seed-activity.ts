/**
 * Demo community activity: questions with answers, discussions, opportunities, votes, bookmarks,
 * teams and applications, stories, mentorship requests, prep items, a simulator history and an open report.
 * Writes only rows owned by demo accounts (email ends with DEMO_EMAIL_SUFFIX), so re-running is safe.
 *
 *   npm run seed:activity -w apps/api
 */
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';

const DEMO = { endsWith: env.DEMO_EMAIL_SUFFIX };
const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600_000);
const daysAhead = (d: number) => new Date(Date.now() + d * 24 * 3600_000);

async function user(handle: string) {
  const u = await prisma.user.findUnique({ where: { handle } });
  if (!u) throw new Error(`Missing demo user "${handle}". Run db:seed:all first.`);
  return u;
}

async function topicId(pattern: RegExp) {
  const topics = await prisma.topic.findMany({ select: { id: true, slug: true } });
  const t = topics.find((x) => pattern.test(x.slug));
  if (!t) throw new Error(`No topic matching ${pattern}. Check the topics seed.`);
  return t.id;
}

/** Deletes activity that demo accounts created before, so a re-run starts from a clean slate. */
async function clearPrevious() {
  const demoIds = (await prisma.user.findMany({ where: { email: DEMO }, select: { id: true } })).map((u) => u.id);
  await prisma.report.deleteMany({ where: { reporterId: { in: demoIds } } });
  await prisma.simSession.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.prepItem.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.story.deleteMany({ where: { slug: { startsWith: 'demo-' } } });
  await prisma.team.deleteMany({ where: { ownerId: { in: demoIds } } });
  await prisma.connection.deleteMany({ where: { OR: [{ requesterId: { in: demoIds } }, { recipientId: { in: demoIds } }] } });
  await prisma.vote.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.bookmark.deleteMany({ where: { userId: { in: demoIds } } });
  await prisma.post.deleteMany({ where: { authorId: { in: demoIds } } });
  await prisma.conversation.deleteMany({ where: { OR: [{ userAId: { in: demoIds } }, { userBId: { in: demoIds } }] } });
  await prisma.donation.deleteMany({ where: { OR: [{ userId: { in: demoIds } }, { campaign: { slug: { startsWith: 'demo-' } } }] } });
  await prisma.campaign.deleteMany({ where: { slug: { startsWith: 'demo-' } } });
  await prisma.event.deleteMany({ where: { title: { startsWith: 'Demo: ' } } });
}

async function main() {
  await clearPrevious();

  const [ananya, priya, vikram, arjun, dev, karthik, aditya, shreya, rahul, manoj, sneha, meera, suresh, anitha, admin] =
    await Promise.all(
      ['ananya', 'priya', 'vikram', 'arjun', 'dev', 'karthik', 'aditya', 'shreya', 'rahul', 'manoj', 'sneha', 'meera', 'suresh', 'anitha', 'admin'].map(user),
    );

  // Story authors who are not in the main group above
  const [deepa, imran, vishal] = await Promise.all(['deepa', 'imran', 'vishal'].map((h) => user(h)));
  const dsa = await topicId(/dsa|leetcode/);
  const placements = await topicId(/placement|interview/);
  const campus = await topicId(/campus/);
  const internships = await topicId(/intern|referral/);
  const hackathons = await topicId(/hackathon|project/);

  // ── Questions with answers (the best answer is set after the comments exist) ──
  const questions = [
    {
      author: ananya, topic: dsa, tags: ['dsa', 'first year'],
      title: 'How should a first year start DSA without burning out?',
      body: 'I know basic Python and C. Everyone says "do LeetCode", but I do not know where to begin or how many problems a week is enough.',
      answers: [
        { by: karthik, body: 'Start with arrays, strings and hashing for two weeks. Do 3 easy and 1 medium a day, and write down the pattern each problem uses. Consistency beats volume.', score: 14 },
        { by: shreya, body: 'Pick one roadmap (the Crossroads DSA roadmap is a good start) and stick to it. Review the solutions you got wrong after two days, not just once. That is where the learning happens.', score: 22, best: true },
        { by: aditya, body: 'Do not skip the fundamentals of time complexity. Interviewers ask about it even for easy problems.', score: 6 },
      ],
    },
    {
      author: priya, topic: campus, tags: ['clubs', 'campus life'],
      title: 'Is it worth joining a technical club in semester 1?',
      body: 'I have too many options and I am worried about my CGPA. Which clubs actually help later?',
      answers: [
        { by: sneha, body: 'Join one, not five. Pick the one where the seniors actually build things, and check the club page reviews on Crossroads before you commit.', score: 9, best: true },
        { by: rahul, body: 'Clubs help most when they lead to a project you can show in interviews. Ask what the last project was, not what the club does on paper.', score: 5 },
      ],
    },
    {
      author: vikram, topic: placements, tags: ['resume review', 'placements'],
      title: 'How do I get my resume reviewed before placement season?',
      body: 'I have two internships listed but I do not know if the bullet points are strong enough. Who can review it?',
      answers: [
        { by: manoj, body: 'Send it to me with the job description you are targeting. I will mark the bullets that do not show impact. Numbers beat adjectives.', score: 11, best: true },
        { by: shreya, body: 'Keep one page, put projects above coursework, and link the GitHub for each project.', score: 4 },
      ],
    },
    {
      author: arjun, topic: internships, tags: ['internships', 'referrals'],
      title: 'Any advice for getting an ML internship in second year?',
      body: 'I have done two Kaggle competitions. Is that enough to apply for ML internships, or do I need a project first?',
      answers: [
        { by: meera, body: 'A small, finished project with a clear README beats two unfinished competitions. Pick one problem, ship a demo, and write up what you tried. Happy to look at it if you share the link.', score: 17, best: true },
      ],
    },
    {
      author: priya, topic: internships, tags: ['research', 'higher studies'],
      title: 'How do I pick a research topic in second year if I want to do an MS?',
      body: 'I like machine learning but I do not know which professor or area to approach. Any advice on picking a topic that is realistic for a second year?',
      answers: [],
    },
  ];

  for (const q of questions) {
    const post = await prisma.post.create({
      data: {
        authorId: q.author.id, kind: 'QUESTION', title: q.title, body: q.body, topicId: q.topic, tags: q.tags,
        score: 0, commentCount: q.answers.length, createdAt: daysAgo(3 + questions.indexOf(q)),
      },
    });
    let best: string | null = null;
    for (const a of q.answers) {
      const c = await prisma.comment.create({
        data: { postId: post.id, authorId: a.by.id, body: a.body, score: a.score, createdAt: daysAgo(2) },
      });
      if (a.best) best = c.id;
    }
    await prisma.post.update({ where: { id: post.id }, data: { bestAnswerId: best, score: q.answers.length * 3 } });
  }

  // ── Discussions and opportunities ──
  await prisma.post.create({
    data: {
      authorId: rahul.id, kind: 'DISCUSSION', topicId: placements, tags: ['placements', 'interview'],
      title: 'What changed in placement rounds this year? Share your experience',
      body: 'Our batch saw an extra online assessment before the technical round. What did your drive look like?',
      commentCount: 0, createdAt: daysAgo(1),
    },
  });
  const opportunities = [
    {
      author: meera, type: 'INTERNSHIP' as const, title: 'ML Engineering Intern (Summer)', org: 'Northwind Labs',
      body: 'Three-month internship on our recommendation models. Strong Python and an ML project expected. Referrals open for Crossroads members.',
      deadline: daysAhead(21), topic: internships,
    },
    {
      author: suresh, type: 'HACKATHON' as const, title: 'Campus Hack Weekend: build for the library', org: 'Student Council',
      body: 'Two-day build event. Teams of three to four, mixed branches welcome. Prizes for the most useful tool.',
      deadline: daysAhead(10), topic: hackathons,
    },
    {
      author: anitha, type: 'CAREER_GUIDANCE' as const, title: 'Founder office hours: validating a startup idea', org: 'LearnLoop',
      body: 'Open to anyone with an idea. Bring a one-page problem statement and we will go through it together.',
      deadline: daysAhead(30), topic: hackathons,
    },
  ];
  for (const o of opportunities) {
    await prisma.post.create({
      data: {
        authorId: o.author.id, kind: 'OPPORTUNITY', title: o.title, body: o.body, topicId: o.topic,
        tags: [o.type.toLowerCase()], opportunityType: o.type, organization: o.org, deadline: o.deadline,
        createdAt: daysAgo(2),
      },
    });
  }

  // ── Votes and bookmarks (some on demo content, so the feed and saved lists are not empty) ──
  const allPosts = await prisma.post.findMany({ where: { authorId: { in: [ananya, priya, vikram, arjun, rahul, meera, suresh, anitha].map((u) => u.id) } }, select: { id: true } });
  const voters = [karthik, shreya, aditya, sneha, manoj, meera, dev, priya];
  for (const [i, post] of allPosts.entries()) {
    for (const v of voters.slice(0, 2 + (i % 4))) {
      await prisma.vote.create({ data: { userId: v.id, targetType: 'POST', targetId: post.id, value: 1 } });
    }
  }
  const firstPost = allPosts[0];
  if (firstPost) {
    await prisma.bookmark.create({ data: { userId: ananya.id, targetType: 'POST', targetId: firstPost.id } });
    await prisma.bookmark.create({ data: { userId: priya.id, targetType: 'POST', targetId: firstPost.id } });
  }

  // ── Teams, study circles and applications ──
  const team = await prisma.team.create({
    data: {
      ownerId: dev.id, kind: 'HACKATHON', title: 'Looking for an ML and a designer for the library hack',
      description: 'Building a book-finder that tells you which shelf a book is on. Need someone for the model and someone for the interface.',
      requiredSkills: ['python', 'figma'], rolesNeeded: ['ML engineer', 'designer'], commitment: '10 hours a week for two weeks',
      maxMembers: 4, status: 'OPEN',
    },
  });
  await prisma.teamApplication.create({ data: { teamId: team.id, applicantId: ananya.id, message: 'I know Python well and can help with the data pipeline.' } });
  await prisma.team.create({
    data: {
      ownerId: karthik.id, kind: 'STUDY_CIRCLE', title: 'Weekly DSA problem circle (Saturdays)', description: 'We solve three problems together and walk through one.',
      commitment: 'Saturdays, 2 hours', meetingDetails: 'Library study room 3', schedule: 'Every Saturday 10 am', openJoin: true, maxMembers: 12,
    },
  });
  await prisma.team.create({
    data: {
      ownerId: anitha.id, kind: 'STARTUP', title: 'Co-founder for a campus tutoring app', description: 'Need a backend engineer who wants to ship a real product over the summer.',
      requiredSkills: ['node', 'postgres'], rolesNeeded: ['backend engineer'], commitment: 'Full time over the summer', maxMembers: 3,
    },
  });

  // ── Stories (published, one spotlight) ──
  await prisma.story.create({
    data: {
      slug: 'demo-from-campus-to-ml-engineer', title: 'From a first-year question to an ML offer', excerpt: 'How one question on this platform led to a mentor, a project and an internship.',
      body: 'Meera answered my first question in week two. Six months later we had built a small recommendation prototype together and I had a referral to Northwind Labs. The advice was simple: finish one project before starting five.',
      tags: ['ml', 'mentorship'], authorId: meera.id, featuredUserId: ananya.id, isSpotlight: true,
      status: 'PUBLISHED', publishedAt: daysAgo(5),
    },
  });
  await prisma.story.create({
    data: {
      slug: 'demo-placement-season-lessons', title: 'Placement season, one year later', excerpt: 'What I would do differently: more mock interviews, fewer applications.',
      body: 'I applied to sixty companies and heard back from six. The turning point was two mock interviews with a senior who asked the same follow-up questions the real panel did.',
      tags: ['placements'], authorId: shreya.id, status: 'PUBLISHED', publishedAt: daysAgo(12),
    },
  });

  // ── More success stories: varied voices, goals and tags for the stories page ──
  const moreStories = [
    {
      slug: 'demo-from-service-to-product-sde', title: 'From a service company offer to a product role', excerpt: 'Two years of DSA, one referral and a lot of mock interviews.',
      body: 'I joined a service company in my final year and nearly stopped there. What changed was a plan from a senior who had made the same jump.\n\nWe spent three months on arrays, graphs and dynamic programming, with one timed set every weekend. Mock interviews with two alumni showed me where I explained badly, not where I was weak.\n\nThe referral came from a mentee I had helped with a project. Preparation is slow, but it compounds.',
      tags: ['placements', 'dsa'], author: karthik, featured: aditya, spotlight: false, daysOld: 20,
    },
    {
      slug: 'demo-building-a-campus-startup', title: 'Building a campus startup before graduating', excerpt: 'A tutoring app, three pilot classes and the first thing I would change.',
      body: 'LearnLoop began as a notes-sharing sheet. Within a semester, forty students were using it for weekly tutoring.\n\nThe hardest part was not the product. It was finding a co-founder who wanted to ship every week, not every term. Being in a campus community made that search possible.\n\nIf I started again, I would validate with ten users before writing any code.',
      tags: ['startups', 'mentorship'], author: anitha, featured: null, spotlight: false, daysOld: 35,
    },
    {
      slug: 'demo-research-year-to-ms-offer', title: 'A research year that led to an MS offer', excerpt: 'How one professor, one reading group and a small paper opened the door.',
      body: 'I was unsure whether an MS was worth it. A second-year research project with a professor in the signal processing lab answered that question for me.\n\nI read one paper a week with a reading group, then reproduced a result. The reproduction became a short workshop paper.\n\nThe statement of purpose was easier to write once I had something concrete to point to.',
      tags: ['higher studies', 'research'], author: deepa, featured: imran, spotlight: false, daysOld: 50,
    },
    {
      slug: 'demo-first-internship-in-finance', title: 'My first internship in quant finance', excerpt: 'Maths was the easy part. Explaining my thinking out loud was the skill I had to build.',
      body: 'The quant interviews focused on probability and on how I reasoned, not only on the answer. I practised by explaining my steps to a friend before writing anything down.\n\nThe internship taught me to write clean code under pressure and to ask questions early.\n\nIf you are preparing now, start with the explanation habit. It matters more than another hundred problems.',
      tags: ['quant', 'internships'], author: vishal, featured: null, spotlight: false, daysOld: 65,
    },
  ];
  for (const st of moreStories) {
    if (!st.author) continue;
    await prisma.story.create({
      data: {
        slug: st.slug, title: st.title, excerpt: st.excerpt, body: st.body, tags: st.tags, authorId: st.author.id,
        featuredUserId: st.featured?.id ?? null, isSpotlight: st.spotlight, status: 'PUBLISHED', publishedAt: daysAgo(st.daysOld),
      },
    });
  }

  // Mock cover images for the demo stories (files live in apps/web/public/mock/stories)
  const covers: Record<string, string> = {
    'demo-from-campus-to-ml-engineer': 'story-1',
    'demo-placement-season-lessons': 'story-2',
    'demo-from-service-to-product-sde': 'story-3',
    'demo-building-a-campus-startup': 'story-4',
    'demo-research-year-to-ms-offer': 'story-5',
    'demo-first-internship-in-finance': 'story-6',
  };
  for (const [slug, file] of Object.entries(covers)) {
    await prisma.story.updateMany({ where: { slug }, data: { coverUrl: `/mock/stories/${file}.svg` } });
  }

  // ── Mentorship and connection requests (feeds the alumni dashboard) ──
  const connections = [
    { from: ananya, to: meera, kind: 'MENTORSHIP' as const, topic: 'Breaking into ML internships', message: 'Would love 20 minutes to ask about projects that get interviews.', status: 'ACCEPTED' as const, respondedAt: daysAgo(6) },
    { from: priya, to: meera, kind: 'PEER_GUIDANCE' as const, topic: 'Choosing a first-year project', message: 'Can you tell me which projects helped you the most?', status: 'ACCEPTED' as const, respondedAt: daysAgo(4) },
    { from: arjun, to: meera, kind: 'MENTORSHIP' as const, topic: 'Preparing for ML interviews', message: 'I have two Kaggle competitions and want to know what to build next.', status: 'PENDING' as const },
    { from: vikram, to: suresh, kind: 'MENTORSHIP' as const, topic: 'Backend interview prep', message: 'Could you review my backend interview plan for placements?', status: 'PENDING' as const },
    { from: sneha, to: suresh, kind: 'PEER_GUIDANCE' as const, topic: 'Resume review', message: 'Would appreciate feedback on my first resume.', status: 'PENDING' as const },
    { from: ananya, to: rahul, kind: 'CONNECT' as const, topic: null, message: 'Hi Rahul, I enjoyed your answer on DSA. Happy to stay in touch.', status: 'ACCEPTED' as const, respondedAt: daysAgo(3) },
  ];
  for (const c of connections) {
    await prisma.connection.create({
      data: {
        requesterId: c.from.id, recipientId: c.to.id, kind: c.kind, topic: c.topic, message: c.message, status: c.status,
        respondedAt: 'respondedAt' in c ? c.respondedAt : null,
      },
    });
  }

  // ── Chat threads between connected people (messages are stored oldest first, Prisma sorts on read) ──
  const threads = [
    {
      a: ananya, b: meera, read: 'a' as const,
      messages: [
        { from: ananya, body: 'Hi Meera, thanks for accepting. Could I ask about projects that got you interviews?', ago: 5 },
        { from: meera, body: 'Of course. A small end-to-end project with a README and a live demo beats five notebooks.', ago: 5 },
        { from: ananya, body: 'That helps a lot. I am thinking of a recommendation prototype for the library. Is that too small?', ago: 4 },
        { from: meera, body: 'Not at all. Scope it to one user flow and write down what you measured.', ago: 4 },
      ],
    },
    {
      a: priya, b: meera, read: 'b' as const,
      messages: [
        { from: priya, body: 'Could you share which first-year project helped you the most?', ago: 3 },
        { from: meera, body: 'The one where I had to deploy something people actually used. Send me your plan and I will look.', ago: 2 },
      ],
    },
    {
      a: ananya, b: rahul, read: 'a' as const,
      messages: [
        { from: ananya, body: 'Your DSA answer was really clear. Do you have a weekly plan you follow?', ago: 2 },
        { from: rahul, body: 'Three problems a day, one of them revisited from last week. Happy to share the sheet.', ago: 1 },
      ],
    },
  ];
  for (const t of threads) {
    const [userAId, userBId] = t.a.id < t.b.id ? [t.a.id, t.b.id] : [t.b.id, t.a.id];
    const last = t.messages.at(-1)!;
    const convo = await prisma.conversation.create({
      data: {
        userAId, userBId,
        lastMessageAt: daysAgo(last.ago), lastMessagePreview: last.body.slice(0, 140), lastMessageSenderId: last.from.id,
        // The thread's reader has read everything; the other side still has the last message unread
        readAtA: t.read === 'a' ? daysAgo(0) : daysAgo(last.ago + 1),
        readAtB: t.read === 'b' ? daysAgo(0) : daysAgo(last.ago + 1),
      },
    });
    for (const m of t.messages) {
      await prisma.message.create({ data: { conversationId: convo.id, senderId: m.from.id, body: m.body, createdAt: daysAgo(m.ago) } });
    }
  }

  // ── Events with seats and prices (phase 11) and giving campaigns ──
  const events = [
    { title: 'Demo: Chapter meet, Bengaluru', description: 'Alumni in Bengaluru meet over dinner. Ask about careers, cities and companies.', category: 'CHAPTER_MEET', days: 9, region: 'Bengaluru', capacity: 40, pricePaise: 0, location: 'Alumni hall, Bengaluru' },
    { title: 'Demo: Reunion weekend 2021 batch', description: 'Five years on. Bring your projects and your stories.', category: 'REUNION', days: 24, region: 'Campus', capacity: 120, pricePaise: 50000, location: 'Main auditorium' },
    { title: 'Demo: Webinar on product-company interviews', description: 'A senior engineer walks through a real interview loop.', category: 'WEBINAR', days: 4, region: 'Online', capacity: null, pricePaise: 0, link: 'https://example.com/webinar' },
  ];
  for (const e of events) {
    const row = await prisma.event.create({
      data: {
        title: e.title, description: e.description, category: e.category as any, startsAt: daysAhead(e.days),
        endsAt: new Date(daysAhead(e.days).getTime() + 2 * 3600_000), region: e.region, capacity: e.capacity,
        pricePaise: e.pricePaise, location: (e as any).location ?? null, link: (e as any).link ?? null, createdById: admin.id,
      },
    });
    if (e.title.startsWith('Demo: Chapter')) {
      for (const who of [ananya, priya, arjun]) {
        await prisma.eventRsvp.create({ data: { eventId: row.id, userId: who.id, code: `DEMO${who.handle.slice(0, 4).toUpperCase()}${row.id.slice(0, 4).toUpperCase()}`, paidPaise: 0 } });
      }
    }
  }
  const campaigns = [
    { slug: 'demo-library-upgrade', title: 'Upgrade the library reading rooms', category: 'INFRASTRUCTURE', goalPaise: 2500000_00, story: 'New desks, better lighting and a quiet room for exam season.', endsIn: 60 },
    { slug: 'demo-research-fellowships', title: 'Undergraduate research fellowships', category: 'RESEARCH', goalPaise: 1000000_00, story: 'Stipends for students who want to spend a summer on a research project with a professor.', endsIn: 90 },
    { slug: 'demo-first-gen-scholarships', title: 'Scholarships for first-generation students', category: 'SCHOLARSHIPS', goalPaise: 500000_00, story: 'Tuition support for students who are the first in their family to attend college.', endsIn: 45 },
  ];
  for (const c of campaigns) {
    const campaign = await prisma.campaign.create({
      data: { slug: c.slug, title: c.title, category: c.category as any, goalPaise: c.goalPaise, story: c.story, endsAt: daysAhead(c.endsIn) },
    });
    for (const [i, donor] of [meera, suresh, anitha, sneha].entries()) {
      await prisma.donation.create({
        data: {
          campaignId: campaign.id, userId: donor.id, amountPaise: (500 + i * 250) * 100, anonymous: i === 3,
          message: i === 0 ? 'Happy to help the next batch.' : '', receipt: `RCPT-DEMO-${campaign.slug.slice(5, 11).toUpperCase()}-${i}`,
          testMode: true, createdAt: daysAgo(i + 1),
        },
      });
    }
  }
  // An official post from the placement cell, shown with its office badge
  await prisma.post.create({
    data: {
      authorId: admin.id, kind: 'DISCUSSION', title: 'Placement drives for the next two weeks', body: 'Registration opens Monday for three drives. Check eligibility on the companies page before you apply.',
      officeName: 'Placement Cell', tags: ['official'], createdAt: daysAgo(1),
    },
  });

  // ── Prep tracker and one finished simulator session for Ananya ──
  const northwind = await prisma.company.findUnique({ where: { slug: 'northwind-labs' } });
  await prisma.prepItem.createMany({
    data: [
      { userId: ananya.id, category: 'OA', title: 'Practise 10 timed aptitude questions', done: true, source: 'custom' },
      { userId: ananya.id, category: 'TECHNICAL', title: 'Solve 20 array and hashing problems', done: false, source: 'roadmap' },
      { userId: ananya.id, category: 'HR', title: 'Write three STAR stories', done: false, source: 'custom' },
      { userId: ananya.id, companyId: northwind?.id ?? null, category: 'TECHNICAL', title: 'Review Northwind ML interview rounds', done: false, source: 'company' },
    ],
  });
  if (northwind) {
    const session = await prisma.simSession.create({
      data: {
        userId: ananya.id, companyId: northwind.id, roundType: 'APTITUDE', difficulty: 2, correctStreak: 1, wrongStreak: 0,
        score: 2, total: 3, maxQuestions: 3, status: 'FINISHED',
        summary: { strengths: ['Percentages'], revise: ['Time and work'], experienceIds: [] },
      },
    });
    await prisma.simQuestion.createMany({
      data: [
        { sessionId: session.id, order: 1, format: 'MCQ', topic: 'Percentages', difficulty: 1, prompt: 'What is 15% of 240?', options: ['30', '36', '40', '24'], correctAnswer: '1', explanation: '15% of 240 is 36.', userAnswer: '1', isCorrect: true, answeredAt: daysAgo(1) },
        { sessionId: session.id, order: 2, format: 'MCQ', topic: 'Time and work', difficulty: 2, prompt: 'A can finish a task in 6 days, B in 3. Together they take?', options: ['2 days', '4 days', '4.5 days', '3 days'], correctAnswer: '0', explanation: 'Combined rate is 1/6 + 1/3 = 1/2, so 2 days.', userAnswer: '1', isCorrect: false, answeredAt: daysAgo(1) },
        { sessionId: session.id, order: 3, format: 'MCQ', topic: 'Percentages', difficulty: 2, prompt: 'A price rises by 20%, then falls by 20%. Net change?', options: ['0%', '-4%', '+4%', '-2%'], correctAnswer: '1', explanation: '1.2 × 0.8 = 0.96, a 4% drop.', userAnswer: '1', isCorrect: true, answeredAt: daysAgo(1) },
      ],
    });
  }

  // ── One open report, so the admin reports queue has something to review ──
  await prisma.report.create({
    data: { reporterId: priya.id, targetType: 'POST', targetId: allPosts[0]?.id ?? 'none', reason: 'MISLEADING', details: 'The deadline in this post looks wrong. Please check.', status: 'OPEN' },
  });

  console.log(`Seeded ${questions.length} questions, 1 discussion, ${opportunities.length} opportunities, 3 teams, ${2 + moreStories.length} stories, ${connections.length} connections, ${threads.length} chat threads. ${events.length} events, ${campaigns.length} campaigns, 1 official post. Admin: ${admin.handle}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
