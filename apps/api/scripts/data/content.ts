// Fictional demo content written by demo users (see scripts/data/users.ts).
// Topics are lowercase so search and the simulator can match them.

type RoundType = 'APTITUDE' | 'CODING' | 'CS_FUNDAMENTALS' | 'TECHNICAL' | 'HR';
type Round = { name: string; type: RoundType; topics: string[]; difficulty: number; notes: string };

export type SeedExperience = {
  author: string; // handle
  company: string; // slug
  role: string;
  year: number;
  difficulty: number;
  prepWeeks?: number;
  outcome: 'SELECTED' | 'NOT_SELECTED' | 'WITHHELD';
  verified?: boolean;
  resources: string[];
  tips: string;
  rounds: Round[];
};

const r = (name: string, type: RoundType, topics: string[], difficulty: number, notes = ''): Round => ({
  name,
  type,
  topics,
  difficulty,
  notes,
});

export const experiences: SeedExperience[] = [
  {
    author: 'rahul', company: 'northwind-labs', role: 'ml engineer', year: 2026, difficulty: 4, prepWeeks: 8, outcome: 'SELECTED', verified: true,
    resources: ['Neetcode 150', 'CS231n lecture notes', 'Designing Machine Learning Systems (book)'],
    tips: 'Know your projects inside out. They asked why I picked YOLO over a two-stage detector and what I would change at 10x scale.',
    rounds: [
      r('Online assessment', 'CODING', ['arrays', 'hashing', 'sliding window'], 3, 'Two problems in 90 minutes plus 10 MCQs on probability and OS.'),
      r('Technical interview 1', 'TECHNICAL', ['trees', 'dp', 'project deep dive'], 4, 'One medium DP problem, then 20 minutes on my helmet detection project.'),
      r('ML interview', 'TECHNICAL', ['bias variance', 'evaluation metrics', 'cnn'], 4, 'Precision vs recall trade-offs for a safety use case; how to handle class imbalance.'),
      r('HR interview', 'HR', ['tell me about yourself', 'teamwork', 'relocation'], 2),
    ],
  },
  {
    author: 'meera', company: 'northwind-labs', role: 'ml engineer intern', year: 2022, difficulty: 3, prepWeeks: 6, outcome: 'SELECTED',
    resources: ['Andrew Ng ML course', 'Kaggle notebooks'],
    tips: 'They care more about clear thinking than fancy models. Explain your baseline first.',
    rounds: [
      r('Online assessment', 'CODING', ['strings', 'two pointers'], 3),
      r('Technical interview', 'TECHNICAL', ['linear regression', 'overfitting', 'python'], 3, 'Whiteboard gradient descent and talk through regularisation.'),
      r('Manager round', 'HR', ['why ml', 'project challenges'], 2),
    ],
  },
  {
    author: 'shreya', company: 'orbit-cloudworks', role: 'software engineer', year: 2026, difficulty: 4, prepWeeks: 12, outcome: 'SELECTED', verified: true,
    resources: ['Striver SDE sheet', 'Grokking the System Design Interview', 'OSTEP (free OS book)'],
    tips: 'Practise talking while coding. The interviewer interrupted often to ask about complexity.',
    rounds: [
      r('Coding round', 'CODING', ['graphs', 'dp', 'binary search'], 4, 'Three problems in 2 hours. Third one was a shortest path variant.'),
      r('Technical interview 1', 'TECHNICAL', ['linked lists', 'complexity analysis'], 3),
      r('Technical interview 2', 'CS_FUNDAMENTALS', ['os scheduling', 'tcp vs udp', 'deadlocks'], 4, 'Very deep on OS. Know process vs thread and how context switching works.'),
      r('HR interview', 'HR', ['ownership', 'conflict resolution'], 2),
    ],
  },
  {
    author: 'suresh', company: 'orbit-cloudworks', role: 'backend developer', year: 2023, difficulty: 4, prepWeeks: 10, outcome: 'SELECTED',
    resources: ['Designing Data-Intensive Applications', 'Linux command line basics'],
    tips: 'For backend roles they expect basic system design even from freshers: caching, queues, a simple rate limiter.',
    rounds: [
      r('Coding round', 'CODING', ['heaps', 'intervals'], 3),
      r('System design basics', 'TECHNICAL', ['caching', 'load balancing', 'rate limiting'], 4, 'Design a URL shortener, then scale it.'),
      r('Linux and networking', 'CS_FUNDAMENTALS', ['linux processes', 'dns', 'http'], 3),
    ],
  },
  {
    author: 'manoj', company: 'meridian-technology-services', role: 'systems engineer', year: 2026, difficulty: 2, prepWeeks: 4, outcome: 'SELECTED',
    resources: ['IndiaBix aptitude', 'GeeksforGeeks SQL practice'],
    tips: 'Aptitude cut-off is the real filter. Do timed tests every day for two weeks.',
    rounds: [
      r('Aptitude test', 'APTITUDE', ['percentages', 'time and work', 'logical reasoning', 'reading comprehension'], 2, '60 minutes, sectional cut-offs.'),
      r('Coding round', 'CODING', ['strings', 'arrays'], 2, 'Two easy problems; any language allowed.'),
      r('Technical interview', 'TECHNICAL', ['java oop', 'sql joins', 'project'], 2),
      r('HR interview', 'HR', ['relocation', 'night shifts', 'tell me about yourself'], 1),
    ],
  },
  {
    author: 'karthik', company: 'meridian-technology-services', role: 'software engineer intern', year: 2025, difficulty: 2, prepWeeks: 3, outcome: 'WITHHELD',
    resources: ['PrepInsta aptitude', 'W3Schools SQL'],
    tips: 'Keep your resume to one page and be ready to explain every line.',
    rounds: [
      r('Aptitude test', 'APTITUDE', ['number series', 'probability', 'verbal ability'], 2),
      r('Technical interview', 'TECHNICAL', ['dbms normalization', 'oop pillars', 'sql'], 2, 'Asked to normalise a sample table to 3NF.'),
    ],
  },
  {
    author: 'anitha', company: 'meridian-technology-services', role: 'systems engineer', year: 2022, difficulty: 2, prepWeeks: 3, outcome: 'SELECTED',
    resources: ['RS Aggarwal quantitative aptitude'],
    tips: 'Communication matters a lot here. Speak slowly and structure your answers.',
    rounds: [
      r('Aptitude and verbal', 'APTITUDE', ['ratios', 'grammar', 'data interpretation'], 2),
      r('Technical and HR', 'HR', ['c basics', 'tell me about yourself', 'strengths and weaknesses'], 2),
    ],
  },
  {
    author: 'rajesh', company: 'harbor-digital-solutions', role: 'product manager', year: 2023, difficulty: 3, prepWeeks: 5, outcome: 'SELECTED',
    resources: ['Decode and Conquer', 'Lenny Newsletter archives'],
    tips: 'Use a simple framework for product questions: users, problems, solutions, metrics.',
    rounds: [
      r('Product sense', 'TECHNICAL', ['product design', 'prioritisation', 'user research'], 3, 'Improve the onboarding of a banking app.'),
      r('Analytical round', 'TECHNICAL', ['metrics', 'sql', 'root cause analysis'], 3),
      r('Leadership round', 'HR', ['stakeholder management', 'conflict resolution'], 2),
    ],
  },
  {
    author: 'nisha', company: 'ironclad-engineering', role: 'embedded intern', year: 2025, difficulty: 3, prepWeeks: 4, outcome: 'SELECTED',
    resources: ['Embedded C by Michael Barr', 'Microcontroller datasheets'],
    tips: 'Bring a hardware project you can demo or at least show photos of. They loved my IoT node.',
    rounds: [
      r('Aptitude and core basics', 'APTITUDE', ['digital electronics', 'c pointers', 'number systems'], 3),
      r('Technical interview', 'TECHNICAL', ['embedded c', 'interrupts', 'i2c vs spi', 'timers'], 3, 'Explain volatile and why it matters in an ISR.'),
      r('HR interview', 'HR', ['location preference', 'teamwork'], 1),
    ],
  },
  {
    author: 'deepa', company: 'ironclad-engineering', role: 'firmware engineer', year: 2023, difficulty: 4, prepWeeks: 6, outcome: 'SELECTED',
    resources: ['FreeRTOS documentation', 'The Art of Electronics (selected chapters)'],
    tips: 'Revise RTOS concepts: tasks, semaphores, priority inversion.',
    rounds: [
      r('Technical interview 1', 'TECHNICAL', ['rtos', 'semaphores', 'priority inversion'], 4),
      r('Technical interview 2', 'CS_FUNDAMENTALS', ['memory layout', 'bit manipulation', 'debugging'], 4, 'Debug a sample firmware crash from a stack trace.'),
      r('Manager round', 'HR', ['leadership', 'mentoring juniors'], 2),
    ],
  },
  {
    author: 'gautham', company: 'quantis-capital', role: 'quant intern', year: 2025, difficulty: 5, prepWeeks: 10, outcome: 'SELECTED', verified: true,
    resources: ['Heard on the Street', 'A Practical Guide to Quantitative Finance Interviews', 'Brilliant probability course'],
    tips: 'Speed matters in the mental maths round. Practise 10 minutes every day for a month.',
    rounds: [
      r('Probability and mental maths', 'APTITUDE', ['probability', 'expected value', 'mental maths'], 5, 'Rapid-fire: 30 questions in 20 minutes.'),
      r('Coding round', 'CODING', ['dp', 'greedy', 'simulation'], 4),
      r('Quant interview', 'TECHNICAL', ['brainteasers', 'statistics', 'market making'], 5, 'A dice game: what price would you quote and why?'),
    ],
  },
  {
    author: 'vishal', company: 'quantis-capital', role: 'quant developer', year: 2022, difficulty: 5, prepWeeks: 12, outcome: 'SELECTED',
    resources: ['Fifty Challenging Problems in Probability', 'C++ Primer'],
    tips: 'They test C++ details: move semantics, memory, performance. Python alone is not enough for dev roles.',
    rounds: [
      r('Online assessment', 'CODING', ['dp', 'graphs', 'bit manipulation'], 5),
      r('C++ and systems', 'CS_FUNDAMENTALS', ['c++ memory', 'move semantics', 'cache locality'], 5),
      r('Probability interview', 'TECHNICAL', ['probability', 'conditional probability', 'expected value'], 4),
    ],
  },
  {
    author: 'fathima', company: 'insightly-analytics', role: 'data analyst', year: 2025, difficulty: 3, prepWeeks: 5, outcome: 'SELECTED',
    resources: ['Mode SQL tutorial', 'Storytelling with Data'],
    tips: 'In the case round, say your assumptions out loud before touching the data.',
    rounds: [
      r('Aptitude and data interpretation', 'APTITUDE', ['charts', 'percentages', 'logical reasoning'], 2),
      r('SQL and Excel test', 'TECHNICAL', ['sql window functions', 'pivot tables', 'joins'], 3, '45 minutes, live dataset of e-commerce orders.'),
      r('Case interview', 'TECHNICAL', ['metrics', 'a/b testing', 'root cause analysis'], 3, 'Sales dropped 15% last month. Why?'),
      r('HR interview', 'HR', ['stakeholder communication', 'tell me about yourself'], 1),
    ],
  },
  {
    author: 'tanvi', company: 'insightly-analytics', role: 'data analyst', year: 2023, difficulty: 3, prepWeeks: 4, outcome: 'SELECTED',
    resources: ['StrataScratch', 'Khan Academy statistics'],
    tips: 'Learn one BI tool well. Bring a dashboard to the interview.',
    rounds: [
      r('SQL test', 'TECHNICAL', ['group by', 'subqueries', 'ctes'], 3),
      r('Statistics round', 'TECHNICAL', ['hypothesis testing', 'distributions', 'correlation vs causation'], 3),
    ],
  },
  {
    author: 'aishwarya', company: 'neuronest-ai', role: 'ml engineer', year: 2026, difficulty: 4, prepWeeks: 8, outcome: 'SELECTED', verified: true,
    resources: ['Dive into Deep Learning (d2l.ai)', 'Hugging Face course', 'Papers with Code'],
    tips: 'Read the papers behind the models you use. They asked me to explain attention from scratch.',
    rounds: [
      r('Coding and ML screening', 'CODING', ['python', 'numpy', 'ml mcqs'], 3),
      r('ML fundamentals', 'TECHNICAL', ['transformers', 'attention', 'regularisation', 'evaluation metrics'], 4),
      r('Design discussion', 'TECHNICAL', ['llm evaluation', 'data pipelines', 'latency'], 4, 'Design an evaluation pipeline for a customer support chatbot.'),
    ],
  },
  {
    author: 'divya', company: 'neuronest-ai', role: 'research intern', year: 2025, difficulty: 4, prepWeeks: 6, outcome: 'NOT_SELECTED',
    resources: ['Stanford CS224n lectures'],
    tips: 'I was not selected but learnt a lot. Have one paper you can discuss critically, including its weaknesses.',
    rounds: [
      r('Research discussion', 'TECHNICAL', ['nlp', 'paper discussion', 'experimental design'], 4),
      r('Coding round', 'CODING', ['python', 'pytorch basics'], 3),
    ],
  },
];

export type SeedReview = { author: string; club: string; usefulness: number; timeCost: number; review: string };

export const clubReviews: SeedReview[] = [
  { author: 'shreya', club: 'init-club', usefulness: 5, timeCost: 3, review: 'Got my first real pull requests merged here. Mentors review your diffs properly, which taught me more git than any course.' },
  { author: 'karthik', club: 'init-club', usefulness: 5, timeCost: 3, review: 'Hacktoberfest drives are well organised. Great way to build a GitHub profile early without huge time pressure.' },
  { author: 'suresh', club: 'idea-club', usefulness: 4, timeCost: 4, review: 'Shipping a real app end to end with a small team taught me more than any single course. Teammates matter a lot here.' },
  { author: 'aishwarya', club: 'idea-club', usefulness: 5, timeCost: 5, review: 'Intense but rewarding. Our project became a portfolio piece that came up in every interview.' },
  { author: 'divya', club: 'arya-club', usefulness: 4, timeCost: 2, review: 'A calm, grounding space in a hectic semester. The sessions are genuinely thoughtful, not preachy.' },
  { author: 'meera', club: 'arya-club', usefulness: 4, timeCost: 2, review: 'Good community and well-run events. Attendance is flexible around exams.' },
  { author: 'rohan', club: 'sadhana-club', usefulness: 4, timeCost: 3, review: 'The seva drives were some of the most meaningful hours of my week, not just another activity for a resume line.' },
  { author: 'kavya', club: 'sadhana-club', usefulness: 4, timeCost: 3, review: 'Well organised and inclusive of all years. Helped me find a sense of community early on.' },
  { author: 'nikhil', club: 'intel-iot-club', usefulness: 5, timeCost: 5, review: 'Huge time commitment before showcase day, but the hands-on embedded and sensor work is unmatched on campus.' },
  { author: 'nisha', club: 'intel-iot-club', usefulness: 4, timeCost: 5, review: 'You will spend evenings debugging hardware. If you love circuits it is the best place to be; otherwise it is a lot.' },
  { author: 'deepa', club: 'intel-iot-club', usefulness: 5, timeCost: 5, review: 'Directly led to my core-engineering internship. Learn soldering and debugging early; it matters in interviews.' },
  { author: 'tarun', club: 'astro-club', usefulness: 4, timeCost: 2, review: 'The stargazing nights are genuinely special. Telescope time is limited, so sign up early.' },
  { author: 'kavya', club: 'photography-club', usefulness: 3, timeCost: 3, review: 'Photo walks are a great low-pressure break from academics. Editing workshops improved my portfolio shots a lot.' },
  { author: 'manoj', club: 'photography-club', usefulness: 3, timeCost: 3, review: 'Fun, flexible and a good way to meet people outside your own branch.' },
  { author: 'imran', club: 'natya-dance-club', usefulness: 2, timeCost: 5, review: 'Rehearsals before fests are long, but performing on stage is a confidence boost unlike anything else.' },
  { author: 'gautham', club: 'natya-dance-club', usefulness: 3, timeCost: 5, review: 'Serious commitment close to competitions. Coaches are understanding around exam weeks.' },
];

type StepKind = 'SKILL' | 'PROJECT' | 'RESOURCE' | 'PRACTICE';
type Step = { id: string; title: string; detail: string; semester: number; kind: StepKind; resources: string[] };

export type SeedRoadmap = {
  author: string;
  goalTrack: 'PRODUCT' | 'SERVICE' | 'QUANT_FINANCE' | 'RESEARCH' | 'STARTUP' | 'MS' | 'MBA';
  title: string;
  summary: string;
  steps: Step[];
  mistakes: string[];
};

let stepCounter = 0;
const s = (semester: number, kind: StepKind, title: string, detail: string, resources: string[] = []): Step => ({
  id: `s${++stepCounter}`,
  title,
  detail,
  semester,
  kind,
  resources,
});

export const roadmaps: SeedRoadmap[] = [
  {
    author: 'shreya', goalTrack: 'PRODUCT', title: 'From zero to a product SDE offer in four years',
    summary: 'What actually worked for me: steady DSA, two solid projects, one internship and lots of mock interviews.',
    steps: [
      s(1, 'SKILL', 'Learn one language properly', 'Pick C++ or Java and learn it beyond syntax: STL/collections, OOP.'),
      s(2, 'PRACTICE', 'Solve 100 easy problems', 'Arrays, strings, hashing. Aim for consistency, not speed.', ['https://leetcode.com']),
      s(3, 'SKILL', 'Core data structures', 'Linked lists, stacks, queues, trees, heaps, graphs.'),
      s(3, 'PROJECT', 'Build a full-stack project', 'Something people on campus actually use, with auth and a database.'),
      s(4, 'PRACTICE', 'Weekly contests', 'One contest per week and upsolve every problem afterwards.'),
      s(5, 'SKILL', 'OS, DBMS and networks', 'Revise the classics: scheduling, deadlocks, normalisation, indexing, TCP.'),
      s(5, 'PRACTICE', 'Internship applications', 'Apply widely and ask seniors for referrals early.'),
      s(6, 'PROJECT', 'Second project with scale', 'Add caching, background jobs and a load test.'),
      s(7, 'PRACTICE', 'Mock interviews', 'At least 10 mocks with seniors before placement season.'),
      s(7, 'SKILL', 'System design basics', 'Caching, queues, rate limiting, designing a URL shortener.'),
    ],
    mistakes: ['Ignored CS fundamentals until fifth semester.', 'Did not practise explaining my code out loud.'],
  },
  {
    author: 'manoj', goalTrack: 'SERVICE', title: 'Cracking service company placements calmly',
    summary: 'Service company processes reward consistency in aptitude, clean basics and confident communication.',
    steps: [
      s(1, 'SKILL', 'Programming basics in C and Java', 'Loops, functions, arrays, OOP basics.'),
      s(2, 'PRACTICE', 'Daily aptitude practice', '20 minutes of quant and reasoning every day.', ['https://www.indiabix.com']),
      s(3, 'SKILL', 'SQL fundamentals', 'Joins, group by, subqueries. Practise 30 queries.'),
      s(4, 'PROJECT', 'One clean mini project', 'A CRUD app you can explain end to end.'),
      s(5, 'SKILL', 'Communication practice', 'Join a club with public speaking; practise self-introduction.'),
      s(6, 'PRACTICE', 'Timed mock tests', 'Simulate the full aptitude test weekly.'),
      s(7, 'PRACTICE', 'HR preparation', 'Prepare answers for 15 common HR questions.'),
      s(7, 'RESOURCE', 'Previous year papers', 'Ask seniors for the pattern of each company.'),
    ],
    mistakes: ['Underestimated sectional cut-offs in aptitude.', 'Memorised HR answers instead of practising them naturally.'],
  },
  {
    author: 'vishal', goalTrack: 'QUANT_FINANCE', title: 'Quant roles: probability first, everything else second',
    summary: 'Quant interviews are about probability, mental maths and clear reasoning under pressure.',
    steps: [
      s(1, 'SKILL', 'Probability foundations', 'Combinatorics, conditional probability, Bayes.'),
      s(2, 'PRACTICE', 'Mental maths drills', '10 minutes daily of fast arithmetic and estimation.'),
      s(3, 'SKILL', 'Statistics', 'Distributions, expectation, variance, hypothesis testing.'),
      s(3, 'SKILL', 'C++ in depth', 'Memory, references, STL performance.'),
      s(4, 'RESOURCE', 'Heard on the Street', 'Work through every chapter with a friend.'),
      s(5, 'PROJECT', 'Backtest a simple strategy', 'Moving-average strategy with honest evaluation.'),
      s(5, 'PRACTICE', 'Competitive programming', 'Keep DSA sharp; OAs are tough.'),
      s(6, 'PRACTICE', 'Brainteaser practice', 'Explain your reasoning out loud, not just the answer.'),
      s(7, 'PRACTICE', 'Mock quant interviews', 'Ask alumni in quant roles for mocks.'),
    ],
    mistakes: ['Started probability too late.', 'Focused only on Python when dev roles needed C++.'],
  },
  {
    author: 'aishwarya', goalTrack: 'RESEARCH', title: 'Getting into ML research as an undergrad',
    summary: 'Research needs depth in one area, a professor who knows your work, and a paper you can defend.',
    steps: [
      s(1, 'SKILL', 'Linear algebra and calculus', 'Revise with a focus on ML intuition.'),
      s(2, 'SKILL', 'Machine learning basics', 'Supervised learning, evaluation, overfitting.'),
      s(3, 'SKILL', 'Deep learning', 'CNNs, RNNs, transformers, training tricks.', ['https://d2l.ai']),
      s(3, 'PRACTICE', 'Read one paper a week', 'Summarise each in five lines.'),
      s(4, 'PROJECT', 'Reproduce a paper', 'Pick a small paper and reproduce its main result.'),
      s(5, 'PRACTICE', 'Email professors', 'Short emails with your reproduction attached.'),
      s(5, 'PROJECT', 'Research internship', 'Summer internship at a university or industry lab.'),
      s(6, 'PROJECT', 'Write a workshop paper', 'Target a workshop at a good venue.'),
      s(7, 'RESOURCE', 'Papers with Code', 'Track state of the art in your area.'),
    ],
    mistakes: ['Read too broadly before picking a focus area.', 'Waited too long to contact professors.'],
  },
  {
    author: 'anitha', goalTrack: 'STARTUP', title: 'Building a startup from campus',
    summary: 'Start small, talk to users every week, and keep a safety net while you validate.',
    steps: [
      s(1, 'SKILL', 'Learn to build quickly', 'Pick one web stack and ship small things.'),
      s(2, 'PROJECT', 'Solve a campus problem', 'Build something for your hostel or club.'),
      s(3, 'PRACTICE', 'Talk to 20 users', 'Interview real users before building more.'),
      s(4, 'SKILL', 'Basics of business', 'Pricing, unit economics, simple financial models.'),
      s(4, 'PRACTICE', 'Pitch competitions', "Join Founders' Forge and pitch every semester."),
      s(5, 'PROJECT', 'Ship an MVP', 'Launch to 100 users and measure retention.'),
      s(6, 'RESOURCE', 'Y Combinator Startup School', 'Free and very practical.', ['https://www.startupschool.org']),
      s(7, 'PRACTICE', 'Find a cofounder', 'Work on a small project together first.'),
    ],
    mistakes: ['Built for six months before talking to users.', 'Tried to do everything alone.'],
  },
  {
    author: 'nikhil', goalTrack: 'MS', title: 'MS abroad in robotics: a timeline that works',
    summary: 'GRE, strong projects, research exposure and good recommendation letters, planned from year two.',
    steps: [
      s(2, 'PROJECT', 'Hands-on robotics project', 'Join the robotics lab and own one subsystem.'),
      s(3, 'SKILL', 'Control systems and ROS', 'PID, kinematics, ROS basics.'),
      s(4, 'PROJECT', 'Research internship', 'IIT or university lab in your area.'),
      s(5, 'PRACTICE', 'GRE preparation', 'Three months of steady prep; aim to finish by semester six.'),
      s(5, 'PRACTICE', 'IELTS or TOEFL', 'Book early; scores are needed by application deadlines.'),
      s(6, 'PRACTICE', 'Shortlist universities', 'Mix of ambitious, target and safe options.'),
      s(7, 'PRACTICE', 'Statement of purpose', 'Five drafts with feedback from alumni.'),
      s(7, 'PRACTICE', 'Recommendation letters', 'Ask professors who know your work at least two months early.'),
    ],
    mistakes: ['Wrote my SOP in a week.', 'Did not ask alumni about the labs I was applying to.'],
  },
  {
    author: 'rajesh', goalTrack: 'MBA', title: 'Engineering to MBA: building a strong profile',
    summary: 'Good work experience, leadership stories and a solid test score matter more than the brand of your first job.',
    steps: [
      s(2, 'PRACTICE', 'Leadership roles', 'Lead a club event or a community project.'),
      s(3, 'SKILL', 'Excel and data analysis', 'Pivot tables, lookups, basic dashboards.'),
      s(4, 'PROJECT', 'Business case competitions', 'Participate in at least two per year.'),
      s(5, 'PRACTICE', 'Internship with impact', 'Choose a role where you own an outcome.'),
      s(7, 'PRACTICE', 'Pick a job with growth', 'Work experience of two to four years strengthens applications.'),
      s(8, 'PRACTICE', 'CAT or GMAT preparation', 'Six months of focused prep while working.'),
      s(8, 'RESOURCE', 'Talk to admitted alumni', 'Ask about essays and interviews.'),
      s(8, 'PRACTICE', 'Essays and interviews', 'Build three strong stories about impact and leadership.'),
    ],
    mistakes: ['Took the GMAT without a real study plan.', 'Did not keep a record of my work achievements.'],
  },
];
