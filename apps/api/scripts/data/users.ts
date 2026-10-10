// Fictional demo people. All emails end with @demo.crossroads (the demo-login marker).
// Companies referenced by alumni/seniors match the seeded company names.

type Category = 'CLUB' | 'PROJECT' | 'INTERNSHIP' | 'COURSE' | 'ACHIEVEMENT' | 'JOB' | 'STARTUP';
type Goal = 'PRODUCT' | 'SERVICE' | 'QUANT_FINANCE' | 'RESEARCH' | 'STARTUP' | 'MS' | 'MBA' | 'UNDECIDED';
type Role = 'STUDENT' | 'SENIOR' | 'ALUMNI';

type Milestone = { yearOfStudy: number; category: Category; title: string; description?: string };
type Project = { title: string; description: string; url?: string };

export type SeedUser = {
  handle: string;
  fullName: string;
  email: string;
  role: Role;
  currentYear: number | null;
  batchYear: number;
  department: string;
  bio: string;
  skills: string[];
  interests: string[];
  targetRoles: string[];
  targetCompanies?: string[];
  goalTrack: Goal;
  canHelpWith: string[];
  lookingFor: string[];
  company?: string;
  jobTitle?: string;
  mentorAvailable?: boolean;
  mentorTopics?: string[];
  mentorSlots?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  showLinkedin?: boolean;
  showGithub?: boolean;
  projects?: Project[];
  achievements?: string[];
  followTopics?: string[]; // topic slugs
  points?: number;
  milestones?: Milestone[];
};

const m = (yearOfStudy: number, category: Category, title: string, description = ''): Milestone => ({
  yearOfStudy,
  category,
  title,
  description,
});

const social = (h: string) => ({
  linkedinUrl: `https://www.linkedin.com/in/demo-${h}`,
  githubUrl: `https://github.com/demo-${h}`,
});

const DEMO_SUFFIX = process.env.DEMO_EMAIL_SUFFIX || '@demo.crossroads';
const base = (handle: string, fullName: string) => ({ handle, fullName, email: `${handle}${DEMO_SUFFIX}` });

export const users: SeedUser[] = [
  // ───────────── First years (7) ─────────────
  {
    ...base('ananya', 'Ananya Iyer'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'CSE-AI',
    bio: 'First year, curious about AI. Looking for a mentor and teammates for my first hackathon.',
    skills: ['python', 'c'], interests: ['ai/ml', 'research', 'web development'], targetRoles: ['ml engineer'],
    targetCompanies: ['northwind-labs', 'neuronest-ai'], goalTrack: 'PRODUCT', canHelpWith: ['campus life'],
    lookingFor: ['mentorship', 'teammates', 'projects'], followTopics: ['ai-ml', 'campus-life', 'hackathons-projects'],
    milestones: [m(1, 'COURSE', 'Started an online Python course')],
  },
  {
    ...base('dev', 'Dev Malhotra'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'CSE',
    bio: 'First year. I like solving puzzles and want to get good at DSA early.',
    skills: ['c++', 'dsa'], interests: ['competitive programming', 'open source'], targetRoles: ['software engineer'],
    goalTrack: 'PRODUCT', canHelpWith: ['campus life'], lookingFor: ['interview prep', 'mentorship'],
    followTopics: ['dsa-leetcode', 'campus-life'],
    milestones: [m(1, 'CLUB', 'Joined the coding club')],
  },
  {
    ...base('priya', 'Priya Nair'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'ECE',
    bio: 'ECE first year with a soft spot for robotics and embedded systems.',
    skills: ['c', 'embedded systems'], interests: ['robotics', 'app development'], targetRoles: ['software engineer'],
    goalTrack: 'SERVICE', canHelpWith: ['campus life'], lookingFor: ['teammates', 'club guidance'],
    followTopics: ['campus-life', 'hackathons-projects'],
    milestones: [m(1, 'CLUB', 'Joined the robotics lab')],
  },
  {
    ...base('arjun', 'Arjun Reddy'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'AIE',
    bio: 'Wants to build things with LLMs. Still learning the basics.',
    skills: ['python', 'javascript'], interests: ['ai/ml', 'startups'], targetRoles: ['founder'],
    goalTrack: 'STARTUP', canHelpWith: ['campus life'], lookingFor: ['mentorship', 'startups'],
    followTopics: ['ai-ml', 'hackathons-projects'],
    milestones: [m(1, 'PROJECT', 'Built a small quiz chatbot')],
  },
  {
    ...base('sneha', 'Sneha Pillai'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'MECH',
    bio: 'Mechanical first year exploring product design and CAD.',
    skills: ['figma'], interests: ['design', 'robotics'], targetRoles: ['ui/ux designer'], goalTrack: 'UNDECIDED',
    canHelpWith: ['campus life'], lookingFor: ['club guidance', 'mentorship'], followTopics: ['campus-life'],
    milestones: [],
  },
  {
    ...base('vikram', 'Vikram Shetty'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'CSE',
    bio: 'Hostel quiz champion, now learning web development.',
    skills: ['javascript', 'react'], interests: ['web development', 'content creation'], targetRoles: ['frontend developer'],
    goalTrack: 'PRODUCT', canHelpWith: ['campus life', 'resume review'], lookingFor: ['projects', 'teammates'],
    followTopics: ['hackathons-projects', 'campus-life'],
    milestones: [m(1, 'PROJECT', 'Built a personal portfolio site')],
  },
  {
    ...base('lakshmi', 'Lakshmi Menon'), role: 'STUDENT', currentYear: 1, batchYear: 2030, department: 'BIOTECH',
    bio: 'Biotech first year interested in data analysis for life sciences.',
    skills: ['python', 'statistics'], interests: ['data science', 'research'], targetRoles: ['data scientist'],
    goalTrack: 'RESEARCH', canHelpWith: ['campus life'], lookingFor: ['mentorship', 'research'],
    followTopics: ['ai-ml', 'campus-life'],
    milestones: [],
  },

  // ───────────── Second / third years (9) ─────────────
  {
    ...base('karthik', 'Karthik Subramanian'), role: 'STUDENT', currentYear: 3, batchYear: 2028, department: 'CSE',
    bio: 'Third year preparing for placements. Always up for a mock interview swap.',
    skills: ['java', 'dsa', 'sql', 'dbms', 'oop'], interests: ['competitive programming', 'cloud and devops'],
    targetRoles: ['software engineer', 'backend developer'], targetCompanies: ['orbit-cloudworks', 'northwind-labs'],
    goalTrack: 'PRODUCT', canHelpWith: ['dsa', 'campus life', 'club guidance'], lookingFor: ['interview prep', 'referrals'],
    ...social('karthik'),
    projects: [{ title: 'Library management system', description: 'Spring Boot and SQL app used by the department library.' }],
    followTopics: ['placements', 'dsa-leetcode', 'internships'],
    milestones: [
      m(1, 'CLUB', 'Joined Code Circle'),
      m(2, 'PROJECT', 'Built a library management system'),
      m(2, 'ACHIEVEMENT', 'Solved 300 LeetCode problems'),
      m(3, 'INTERNSHIP', 'Summer internship at a service company'),
    ],
  },
  {
    ...base('divya', 'Divya Krishnan'), role: 'STUDENT', currentYear: 2, batchYear: 2029, department: 'CSE-AI',
    bio: 'Second year, building NLP side projects and reading papers.',
    skills: ['python', 'nlp', 'machine learning', 'deep learning'], interests: ['ai/ml', 'research'],
    targetRoles: ['ml engineer', 'research engineer'], targetCompanies: ['neuronest-ai'], goalTrack: 'RESEARCH',
    canHelpWith: ['projects', 'dsa'], lookingFor: ['research', 'mentorship'], ...social('divya'),
    projects: [{ title: 'Malayalam sentiment classifier', description: 'NLP model fine-tuned on a small tweet dataset.' }],
    followTopics: ['ai-ml', 'hackathons-projects'],
    milestones: [m(1, 'COURSE', 'Completed a machine learning course'), m(2, 'PROJECT', 'Built a sentiment classifier')],
  },
  {
    ...base('rohan', 'Rohan Das'), role: 'STUDENT', currentYear: 2, batchYear: 2029, department: 'CSE',
    bio: 'Web developer and hackathon regular.',
    skills: ['react', 'node.js', 'typescript', 'sql'], interests: ['web development', 'startups'],
    targetRoles: ['full stack developer'], goalTrack: 'STARTUP', canHelpWith: ['projects', 'teammates'],
    lookingFor: ['teammates', 'startups'], ...social('rohan'),
    projects: [{ title: 'Campus events board', description: 'React and Node app listing events and clubs.' }],
    followTopics: ['hackathons-projects', 'internships'],
    milestones: [m(1, 'CLUB', 'Joined Open Source Guild'), m(2, 'ACHIEVEMENT', 'Won second place at a 24-hour hackathon')],
  },
  {
    ...base('nisha', 'Nisha Thomas'), role: 'STUDENT', currentYear: 3, batchYear: 2028, department: 'ECE',
    bio: 'Third year, embedded and IoT. Applying for core internships.',
    skills: ['c', 'embedded systems', 'iot', 'python'], interests: ['robotics', 'cloud and devops'],
    targetRoles: ['software engineer'], targetCompanies: ['ironclad-engineering'], goalTrack: 'SERVICE',
    canHelpWith: ['projects', 'club guidance'], lookingFor: ['internships', 'referrals'], ...social('nisha'),
    projects: [{ title: 'Soil moisture IoT node', description: 'Low-power LoRa sensor network for the campus garden.' }],
    followTopics: ['internships', 'placements'],
    milestones: [m(1, 'CLUB', 'Joined the robotics lab'), m(2, 'PROJECT', 'Built an IoT sensor node'), m(3, 'INTERNSHIP', 'Embedded intern at a local firm')],
  },
  {
    ...base('aditya', 'Aditya Rao'), role: 'STUDENT', currentYear: 3, batchYear: 2028, department: 'CSE',
    bio: 'Aiming for quant roles. Probability nerd.',
    skills: ['python', 'statistics', 'probability', 'dsa'], interests: ['quant/finance', 'competitive programming'],
    targetRoles: ['quant analyst'], targetCompanies: ['quantis-capital'], goalTrack: 'QUANT_FINANCE',
    canHelpWith: ['dsa'], lookingFor: ['interview prep', 'mentorship'], ...social('aditya'),
    followTopics: ['placements', 'dsa-leetcode'],
    milestones: [m(1, 'COURSE', 'Probability and statistics course'), m(2, 'ACHIEVEMENT', 'Top 50 in a national coding contest')],
  },
  {
    ...base('kavya', 'Kavya Bhat'), role: 'STUDENT', currentYear: 2, batchYear: 2029, department: 'AIE',
    bio: 'Design-minded engineer. Figma to React.',
    skills: ['figma', 'ui/ux', 'react', 'javascript'], interests: ['design', 'web development', 'product management'],
    targetRoles: ['ui/ux designer', 'frontend developer'], goalTrack: 'PRODUCT', canHelpWith: ['projects', 'resume review'],
    lookingFor: ['teammates', 'mentorship'], ...social('kavya'),
    followTopics: ['hackathons-projects', 'campus-life'],
    milestones: [m(1, 'CLUB', 'Joined Spotlight Drama as set designer'), m(2, 'PROJECT', 'Redesigned the department website')],
  },
  {
    ...base('imran', 'Imran Sheikh'), role: 'STUDENT', currentYear: 2, batchYear: 2029, department: 'EEE',
    bio: 'Power systems student getting into data analysis.',
    skills: ['python', 'excel', 'sql', 'power bi'], interests: ['data science', 'higher studies'],
    targetRoles: ['data analyst'], targetCompanies: ['insightly-analytics'], goalTrack: 'MS',
    canHelpWith: ['campus life'], lookingFor: ['higher studies', 'internships'], ...social('imran'),
    followTopics: ['internships', 'campus-life'],
    milestones: [m(2, 'COURSE', 'Power BI dashboard course')],
  },
  {
    ...base('sana', 'Sana Farooq'), role: 'STUDENT', currentYear: 3, batchYear: 2028, department: 'MBA',
    bio: 'Management student interested in product and strategy.',
    skills: ['excel', 'marketing', 'business strategy', 'public speaking'], interests: ['product management', 'startups'],
    targetRoles: ['product manager', 'consultant'], goalTrack: 'MBA', canHelpWith: ['resume review', 'public speaking'],
    lookingFor: ['mentorship', 'startups'], ...social('sana'),
    followTopics: ['placements', 'campus-life'],
    milestones: [m(1, 'CLUB', "Joined Founders' Forge"), m(3, 'ACHIEVEMENT', 'Best pitch at the campus business plan contest')],
  },
  {
    ...base('tarun', 'Tarun Gopal'), role: 'STUDENT', currentYear: 2, batchYear: 2029, department: 'CSE',
    bio: 'Cybersecurity and CTFs. Always up late.',
    skills: ['linux', 'python', 'cybersecurity', 'networking'], interests: ['cybersecurity', 'open source'],
    targetRoles: ['security engineer'], goalTrack: 'PRODUCT', canHelpWith: ['projects'],
    lookingFor: ['teammates', 'mentorship'], ...social('tarun'),
    followTopics: ['hackathons-projects', 'internships'],
    milestones: [m(1, 'CLUB', 'Joined Cyber Shield'), m(2, 'ACHIEVEMENT', 'Top 10 in a college CTF')],
  },

  // ───────────── Final-year seniors (7) ─────────────
  {
    ...base('rahul', 'Rahul Menon'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'CSE-AI',
    bio: 'Final year. Love computer vision and helping juniors start ML the right way.',
    skills: ['python', 'computer vision', 'deep learning', 'dsa', 'sql'], interests: ['ai/ml', 'research', 'competitive programming'],
    targetRoles: ['ml engineer'], goalTrack: 'PRODUCT', canHelpWith: ['interview prep', 'dsa', 'internships', 'projects', 'club guidance'],
    lookingFor: ['teammates'], mentorAvailable: true, mentorTopics: ['ml projects', 'internship prep'], mentorSlots: 'Sat 5–6 pm',
    company: 'Northwind Labs', jobTitle: 'ML Engineer (incoming)', points: 220, ...social('rahul'),
    projects: [{ title: 'Helmet detection for campus gates', description: 'Real-time computer vision model with YOLO, deployed on a Jetson.' }],
    achievements: ['Placed at Northwind Labs', 'Top 10 at the campus hackathon'],
    followTopics: ['ai-ml', 'placements', 'dsa-leetcode'],
    milestones: [
      m(1, 'CLUB', 'Joined the coding club'),
      m(1, 'COURSE', 'Finished a Python and DSA basics course'),
      m(2, 'PROJECT', 'Built a face-attendance system'),
      m(2, 'ACHIEVEMENT', 'Top 10 at the campus hackathon'),
      m(3, 'INTERNSHIP', 'Computer vision intern at Northwind Labs'),
      m(4, 'JOB', 'Placed as ML engineer at Northwind Labs'),
    ],
  },
  {
    ...base('shreya', 'Shreya Kulkarni'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'CSE',
    bio: 'Final year, placed in a product company. Happy to do mock interviews.',
    skills: ['java', 'dsa', 'system design', 'sql', 'dbms', 'oop'], interests: ['competitive programming', 'cloud and devops'],
    targetRoles: ['software engineer'], goalTrack: 'PRODUCT', canHelpWith: ['interview prep', 'dsa', 'resume review', 'referrals'],
    lookingFor: [], mentorAvailable: true, mentorTopics: ['placement prep', 'dsa'], mentorSlots: 'Sun 11 am–12 pm',
    company: 'Orbit Cloudworks', jobTitle: 'Software Engineer (incoming)', points: 310, ...social('shreya'),
    projects: [{ title: 'Distributed rate limiter', description: 'Redis-backed token bucket in Java with a load-test report.' }],
    achievements: ['Placed at Orbit Cloudworks', 'ACM regional finalist'],
    followTopics: ['placements', 'dsa-leetcode', 'internships'],
    milestones: [
      m(1, 'CLUB', 'Joined Code Circle'),
      m(2, 'ACHIEVEMENT', 'Solved 500 LeetCode problems'),
      m(2, 'PROJECT', 'Built a distributed rate limiter'),
      m(3, 'INTERNSHIP', 'Summer intern at Orbit Cloudworks'),
      m(3, 'ACHIEVEMENT', 'ACM regional finalist'),
      m(4, 'JOB', 'Placed as software engineer at Orbit Cloudworks'),
    ],
  },
  {
    ...base('nikhil', 'Nikhil Varma'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'ECE',
    bio: 'Embedded systems and robotics. Led the robotics lab this year.',
    skills: ['c++', 'embedded systems', 'robotics', 'iot', 'c'], interests: ['robotics', 'higher studies'],
    targetRoles: ['research engineer'], goalTrack: 'MS', canHelpWith: ['projects', 'club guidance', 'higher studies'],
    lookingFor: [], mentorAvailable: true, mentorTopics: ['robotics projects', 'ms applications'], mentorSlots: 'Fri 6–7 pm',
    company: 'Ironclad Engineering', jobTitle: 'Embedded Engineer (incoming)', points: 140, ...social('nikhil'),
    projects: [{ title: 'Autonomous line follower', description: 'PID-controlled robot that won a national robotics event.' }],
    followTopics: ['hackathons-projects', 'campus-life'],
    milestones: [
      m(1, 'CLUB', 'Joined the robotics lab'),
      m(2, 'PROJECT', 'Built an autonomous line follower'),
      m(3, 'ACHIEVEMENT', 'Won a national robotics competition'),
      m(3, 'INTERNSHIP', 'Research intern at an IIT lab'),
      m(4, 'ACHIEVEMENT', 'Lead of the robotics lab'),
      m(4, 'JOB', 'Placed at Ironclad Engineering'),
    ],
  },
  {
    ...base('aishwarya', 'Aishwarya Ramesh'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'AIE',
    bio: 'NLP researcher turned ML engineer. Ask me about research internships.',
    skills: ['python', 'nlp', 'machine learning', 'deep learning', 'llms', 'statistics'], interests: ['ai/ml', 'research', 'higher studies'],
    targetRoles: ['ml engineer', 'research engineer'], goalTrack: 'RESEARCH',
    canHelpWith: ['research', 'higher studies', 'projects', 'resume review'], lookingFor: [],
    mentorAvailable: true, mentorTopics: ['research internships', 'nlp projects'], mentorSlots: 'Wed 7–8 pm',
    company: 'NeuroNest AI', jobTitle: 'ML Engineer (incoming)', points: 260, ...social('aishwarya'),
    projects: [{ title: 'Low-resource translation', description: 'NLP translation model for regional languages, co-authored workshop paper.' }],
    achievements: ['Workshop paper at an NLP venue'],
    followTopics: ['ai-ml', 'internships'],
    milestones: [
      m(1, 'COURSE', 'Deep learning specialisation'),
      m(2, 'PROJECT', 'Built a translation model'),
      m(2, 'CLUB', 'Joined AI Collective'),
      m(3, 'INTERNSHIP', 'Research intern at an NLP lab'),
      m(3, 'ACHIEVEMENT', 'Workshop paper accepted'),
      m(4, 'JOB', 'Placed at NeuroNest AI'),
    ],
  },
  {
    ...base('manoj', 'Manoj Kumar'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'CSE',
    bio: 'Service-company offer holder who also ran the college fest tech team.',
    skills: ['java', 'sql', 'react', 'aptitude', 'communication'], interests: ['web development', 'content creation'],
    targetRoles: ['software engineer'], goalTrack: 'SERVICE', canHelpWith: ['interview prep', 'resume review', 'campus life'],
    lookingFor: [], mentorAvailable: true, mentorTopics: ['service company prep', 'aptitude'], mentorSlots: 'Sat 10–11 am',
    company: 'Meridian Technology Services', jobTitle: 'Systems Engineer (incoming)', points: 90, ...social('manoj'),
    followTopics: ['placements', 'campus-life'],
    milestones: [
      m(1, 'CLUB', 'Joined the event management team'),
      m(2, 'PROJECT', 'Built the fest registration portal'),
      m(3, 'INTERNSHIP', 'Intern at Harbor Digital Solutions'),
      m(4, 'JOB', 'Placed at Meridian Technology Services'),
    ],
  },
  {
    ...base('fathima', 'Fathima Rasheed'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'CSE',
    bio: 'Data analytics intern turned full-time. SQL and dashboards are my thing.',
    skills: ['sql', 'excel', 'power bi', 'python', 'statistics'], interests: ['data science', 'product management'],
    targetRoles: ['data analyst'], goalTrack: 'SERVICE', canHelpWith: ['internships', 'interview prep', 'projects'],
    lookingFor: [], mentorAvailable: false, company: 'Insightly Analytics', jobTitle: 'Data Analyst (incoming)',
    points: 120, ...social('fathima'),
    projects: [{ title: 'Campus mess waste dashboard', description: 'Power BI dashboard on food waste adopted by the hostel committee.' }],
    followTopics: ['internships', 'placements'],
    milestones: [
      m(2, 'COURSE', 'Data analytics certification'),
      m(3, 'PROJECT', 'Built the mess waste dashboard'),
      m(3, 'INTERNSHIP', 'Analytics intern at Insightly Analytics'),
      m(4, 'JOB', 'Converted to a full-time offer'),
    ],
  },
  {
    ...base('gautham', 'Gautham Pai'), role: 'SENIOR', currentYear: 4, batchYear: 2027, department: 'CSE',
    bio: 'Quant-curious final year. Preparing for MS applications and quant roles.',
    skills: ['python', 'probability', 'statistics', 'dsa', 'c++'], interests: ['quant/finance', 'higher studies'],
    targetRoles: ['quant analyst'], goalTrack: 'QUANT_FINANCE', canHelpWith: ['higher studies', 'dsa', 'interview prep'],
    lookingFor: ['referrals'], mentorAvailable: true, mentorTopics: ['quant interviews', 'ms applications'],
    mentorSlots: 'Thu 8–9 pm', company: 'Quantis Capital', jobTitle: 'Quant Intern', points: 180, ...social('gautham'),
    followTopics: ['placements', 'dsa-leetcode'],
    milestones: [
      m(1, 'COURSE', 'Probability course'),
      m(2, 'ACHIEVEMENT', 'Mathematical olympiad medal'),
      m(3, 'INTERNSHIP', 'Quant research intern at Quantis Capital'),
      m(4, 'ACHIEVEMENT', 'Admitted to an MS programme (deferred)'),
    ],
  },

  // ───────────── Alumni (7) ─────────────
  {
    ...base('meera', 'Meera Subramaniam'), role: 'ALUMNI', currentYear: null, batchYear: 2021, department: 'CSE-AI',
    bio: 'ML engineer. Mentoring juniors on breaking into machine learning is my favourite part of the week.',
    skills: ['python', 'machine learning', 'deep learning', 'nlp', 'system design'], interests: ['ai/ml', 'research'],
    targetRoles: ['ml engineer'], goalTrack: 'PRODUCT', canHelpWith: ['mentorship', 'interview prep', 'internships', 'research', 'projects'],
    lookingFor: [], company: 'Northwind Labs', jobTitle: 'Senior ML Engineer', mentorAvailable: true,
    mentorTopics: ['ml careers', 'research to industry', 'interview prep'], mentorSlots: 'Sun 6–7 pm', points: 480, ...social('meera'),
    projects: [{ title: 'Recommendation ranking service', description: 'Led an ML ranking service serving millions of requests a day.' }],
    achievements: ['Alumni mentor of the year'],
    followTopics: ['ai-ml', 'placements', 'internships'],
    milestones: [
      m(1, 'CLUB', 'Joined AI Collective'),
      m(2, 'PROJECT', 'Built an image captioning model'),
      m(3, 'INTERNSHIP', 'ML intern at Northwind Labs'),
      m(4, 'JOB', 'Placed at Northwind Labs'),
      m(5, 'JOB', 'Started as ML engineer at Northwind Labs'),
      m(5, 'ACHIEVEMENT', 'Promoted to Senior ML engineer'),
    ],
  },
  {
    ...base('suresh', 'Suresh Narayanan'), role: 'ALUMNI', currentYear: null, batchYear: 2019, department: 'CSE',
    bio: 'Backend engineer in distributed systems. Happy to review your resume and system design.',
    skills: ['java', 'c++', 'system design', 'cloud', 'dsa', 'linux'], interests: ['cloud and devops', 'open source'],
    targetRoles: ['backend developer'], goalTrack: 'PRODUCT', canHelpWith: ['mentorship', 'interview prep', 'resume review', 'referrals'],
    lookingFor: [], company: 'Orbit Cloudworks', jobTitle: 'Staff Software Engineer', mentorAvailable: true,
    mentorTopics: ['system design', 'backend careers'], mentorSlots: 'Sat 8–9 pm', points: 390, ...social('suresh'),
    followTopics: ['placements', 'dsa-leetcode'],
    milestones: [
      m(1, 'CLUB', 'Joined Code Circle'),
      m(2, 'ACHIEVEMENT', 'ACM ICPC regionals'),
      m(3, 'INTERNSHIP', 'Intern at Orbit Cloudworks'),
      m(4, 'JOB', 'Placed at Orbit Cloudworks'),
      m(5, 'JOB', 'Software engineer at Orbit Cloudworks'),
      m(5, 'ACHIEVEMENT', 'Promoted to Staff engineer'),
    ],
  },
  {
    ...base('anitha', 'Anitha George'), role: 'ALUMNI', currentYear: null, batchYear: 2020, department: 'CSE',
    bio: 'Founder of a small edtech startup. Left a service job to build it.',
    skills: ['product management', 'react', 'node.js', 'business strategy', 'marketing'], interests: ['startups', 'product management'],
    targetRoles: ['founder'], goalTrack: 'STARTUP', canHelpWith: ['startups', 'mentorship', 'teammates', 'resume review'],
    lookingFor: ['teammates'], company: 'LearnLoop (own startup)', jobTitle: 'Founder and CEO', mentorAvailable: true,
    mentorTopics: ['startups', 'product thinking'], mentorSlots: 'Sun 4–5 pm', points: 300, ...social('anitha'),
    achievements: ['Seed funded in 2024'],
    followTopics: ['hackathons-projects', 'internships'],
    milestones: [
      m(1, 'CLUB', "Joined Founders' Forge"),
      m(3, 'PROJECT', 'Built the first prototype of LearnLoop'),
      m(4, 'JOB', 'Placed at Meridian Technology Services'),
      m(5, 'JOB', 'Worked as a systems engineer for 1.5 years'),
      m(5, 'STARTUP', 'Founded LearnLoop'),
      m(5, 'ACHIEVEMENT', 'Raised a seed round'),
    ],
  },
  {
    ...base('vishal', 'Vishal Sharma'), role: 'ALUMNI', currentYear: null, batchYear: 2022, department: 'CSE',
    bio: 'Quant developer. Interview prep for probability-heavy rounds is my speciality.',
    skills: ['python', 'probability', 'statistics', 'c++', 'dsa'], interests: ['quant/finance', 'competitive programming'],
    targetRoles: ['quant analyst'], goalTrack: 'QUANT_FINANCE', canHelpWith: ['interview prep', 'mentorship', 'higher studies'],
    lookingFor: [], company: 'Quantis Capital', jobTitle: 'Quant Developer', mentorAvailable: true,
    mentorTopics: ['quant interviews', 'probability prep'], mentorSlots: 'Fri 9–10 pm', points: 210, ...social('vishal'),
    followTopics: ['placements', 'dsa-leetcode'],
    milestones: [
      m(1, 'COURSE', 'Probability and stochastic processes'),
      m(2, 'ACHIEVEMENT', 'National mathematics olympiad finalist'),
      m(3, 'INTERNSHIP', 'Quant intern at Quantis Capital'),
      m(4, 'JOB', 'Placed at Quantis Capital'),
      m(5, 'JOB', 'Quant developer at Quantis Capital'),
    ],
  },
  {
    ...base('deepa', 'Deepa Venkat'), role: 'ALUMNI', currentYear: null, batchYear: 2018, department: 'ECE',
    bio: 'Embedded firmware lead. Women in core engineering, mentoring welcome.',
    skills: ['embedded systems', 'c', 'iot', 'digital electronics', 'c programming'], interests: ['robotics', 'higher studies'],
    targetRoles: ['research engineer'], goalTrack: 'PRODUCT', canHelpWith: ['mentorship', 'higher studies', 'projects', 'club guidance'],
    lookingFor: [], company: 'Ironclad Engineering', jobTitle: 'Firmware Lead', mentorAvailable: true,
    mentorTopics: ['embedded careers', 'ms in the us'], mentorSlots: 'Sat 6–7 pm', points: 250, ...social('deepa'),
    followTopics: ['campus-life', 'internships'],
    milestones: [
      m(1, 'CLUB', 'Joined the robotics lab'),
      m(2, 'PROJECT', 'Built a drone flight controller'),
      m(3, 'INTERNSHIP', 'Intern at Ironclad Engineering'),
      m(4, 'JOB', 'Placed at Ironclad Engineering'),
      m(5, 'JOB', 'Firmware engineer at Ironclad Engineering'),
      m(5, 'ACHIEVEMENT', 'Promoted to firmware lead'),
    ],
  },
  {
    ...base('rajesh', 'Rajesh Khanna'), role: 'ALUMNI', currentYear: null, batchYear: 2017, department: 'MBA',
    bio: 'Product manager. Moved from engineering to product after an MBA.',
    skills: ['product management', 'sql', 'business strategy', 'communication', 'excel'], interests: ['product management', 'startups'],
    targetRoles: ['product manager'], goalTrack: 'MBA', canHelpWith: ['mentorship', 'mba', 'resume review', 'interview prep'],
    lookingFor: [], company: 'Harbor Digital Solutions', jobTitle: 'Senior Product Manager', mentorAvailable: true,
    mentorTopics: ['product management', 'mba admissions'], mentorSlots: 'Sun 8–9 pm', points: 170, ...social('rajesh'),
    followTopics: ['placements', 'campus-life'],
    milestones: [
      m(1, 'CLUB', 'Joined the debating society'),
      m(3, 'INTERNSHIP', 'Intern at Harbor Digital Solutions'),
      m(4, 'JOB', 'Placed at Harbor Digital Solutions'),
      m(5, 'ACHIEVEMENT', 'Admitted to a top MBA programme'),
      m(5, 'JOB', 'Product manager after MBA'),
    ],
  },
  {
    ...base('tanvi', 'Tanvi Joshi'), role: 'ALUMNI', currentYear: null, batchYear: 2023, department: 'AIE',
    bio: 'Data analyst turned analytics manager. Love teaching SQL.',
    skills: ['sql', 'power bi', 'python', 'statistics', 'excel'], interests: ['data science', 'product management'],
    targetRoles: ['data analyst', 'data scientist'], goalTrack: 'SERVICE', canHelpWith: ['mentorship', 'internships', 'interview prep', 'projects'],
    lookingFor: [], company: 'Insightly Analytics', jobTitle: 'Analytics Manager', mentorAvailable: false,
    points: 150, ...social('tanvi'),
    followTopics: ['internships', 'placements'],
    milestones: [
      m(2, 'COURSE', 'Data analytics bootcamp'),
      m(3, 'INTERNSHIP', 'Analytics intern at Insightly Analytics'),
      m(4, 'JOB', 'Placed at Insightly Analytics'),
      m(5, 'ACHIEVEMENT', 'Promoted to analytics manager'),
    ],
  },
];
