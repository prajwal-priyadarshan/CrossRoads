export const questions = [
  {
    author: 'ananya',
    title: 'Which coding club should I join?',
    body: 'I am a first-year student and want to start with competitive programming. Which club is more active for CP beginners?',
    topic: 'clubs',
  },
  {
    author: 'ananya',
    title: 'Is CGPA important for placements?',
    body: 'I heard some companies have strict cutoffs. What should be my target CGPA if I want to apply for Product-based companies?',
    topic: 'academics',
  },
  {
    author: 'ananya',
    title: 'How do I start ML in first year?',
    body: 'I have some basic Python knowledge. Should I do Andrew Ng course or learn mathematics first?',
    topic: 'tech',
  },
  {
    author: 'ananya',
    title: 'Hostel vs day scholar?',
    body: 'Can any seniors share if staying in hostel helps with participating in hackathons and club activities compared to being a day scholar?',
    topic: 'campus-life',
  }
];

export const answers = [
  { author: 'rahul', questionIndex: 0, body: 'Definitely join the CP club. They hold weekly contests and pair you with mentors.', isBest: true },
  { author: 'meera', questionIndex: 1, body: 'Yes, aim for at least 8.0 to clear the initial resume screening for 90% of companies.', isBest: true },
  { author: 'rahul', questionIndex: 2, body: 'Start with Andrew Ng to build intuition, but dont skip linear algebra.', isBest: false },
  { author: 'karthik', questionIndex: 3, body: 'Hostel gives you a massive advantage because you can stay up late for hackathons with your team.', isBest: true }
];

export const opportunities = [
  {
    author: 'admin',
    title: 'Summer Research Internship',
    company: 'Amrita CREATE',
    type: 'RESEARCH',
    location: 'Coimbatore Campus',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
    link: 'https://amrita.edu',
    description: 'Looking for 2nd year students with strong Python skills.'
  }
];

export const teams = [
  {
    author: 'karthik',
    title: 'Smart India Hackathon Team',
    description: 'Looking for a UI designer and frontend developer.',
    skills: ['Figma', 'React'],
    size: 6,
    openings: 2
  }
];

export const stories = [
  {
    author: 'admin',
    title: 'From Amrita to Amazon: Meera\'s Journey',
    slug: 'meera-amazon',
    summary: 'How Meera cracked the SDE role through consistent open source contributions.',
    content: 'Meera started her journey in the second year... (Placeholder content).',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
  }
];

export const prepItems = [
  {
    author: 'karthik',
    companyId: 1,
    track: 'TECHNICAL',
    title: 'Master Graph Algorithms',
    completed: false
  }
];
