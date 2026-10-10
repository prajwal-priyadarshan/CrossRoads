export const TOPICS = [
  { slug: 'dsa-leetcode', name: 'DSA and LeetCode', icon: 'binary', description: 'Problem solving, patterns, contests and practice plans.', relatedInterests: ['competitive programming'] },
  { slug: 'ai-ml', name: 'Machine learning and data', icon: 'flask-conical', description: 'Machine learning, deep learning, language models and projects.', relatedInterests: ['ai/ml', 'data science', 'research'] },
  { slug: 'placements', name: 'Placements and Interview Experiences', icon: 'briefcase', description: 'Company processes, rounds and preparation.', relatedInterests: ['product management', 'quant/finance', 'higher studies'] },
  { slug: 'internships', name: 'Internships and Referrals', icon: 'send', description: 'Finding internships, applying and referrals.', relatedInterests: ['startups', 'cloud and devops', 'cybersecurity'] },
  { slug: 'hackathons-projects', name: 'Hackathons and Projects', icon: 'rocket', description: 'Teams, ideas, builds and showcases.', relatedInterests: ['web development', 'app development', 'open source', 'robotics', 'design'] },
  { slug: 'campus-life', name: 'Campus Life and Academics', icon: 'graduation-cap', description: 'Clubs, courses, exams, hostel and life.', relatedInterests: ['content creation'] },
] as const;

/** Topic preselected in onboarding when no interest maps to a topic */
export const DEFAULT_TOPIC_SLUG = 'campus-life';

export const SKILLS = [
  'python', 'java', 'c++', 'c', 'javascript', 'typescript', 'dsa', 'competitive programming', 'sql', 'react', 'node.js',
  'next.js', 'django', 'flask', 'spring boot', 'android', 'flutter', 'ios', 'machine learning', 'deep learning',
  'computer vision', 'nlp', 'generative ai', 'llms', 'data analysis', 'statistics', 'power bi', 'excel', 'cloud', 'aws',
  'docker', 'kubernetes', 'linux', 'git', 'system design', 'cybersecurity', 'blockchain', 'embedded systems', 'iot',
  'robotics', 'figma', 'ui/ux', 'product management', 'finance', 'quant', 'public speaking', 'writing', 'marketing',
  'business strategy', 'video editing', 'operating systems', 'dbms', 'oop', 'aptitude', 'probability', 'communication',
  'digital electronics', 'c programming', 'networking',
] as const;

export const INTERESTS = [
  'ai/ml', 'web development', 'app development', 'data science', 'cybersecurity', 'cloud and devops', 'competitive programming',
  'quant/finance', 'product management', 'startups', 'research', 'higher studies', 'design', 'robotics', 'open source', 'content creation',
] as const;

export const GOAL_TRACKS = [
  { value: 'PRODUCT', label: 'Product company job', description: 'SDE and engineering roles at product companies', icon: 'code-xml' },
  { value: 'SERVICE', label: 'Service company job', description: 'Roles at IT services and consulting firms', icon: 'building-2' },
  { value: 'QUANT_FINANCE', label: 'Quant or finance', description: 'Quant, trading, fintech and finance roles', icon: 'chart-candlestick' },
  { value: 'RESEARCH', label: 'Research', description: 'Research internships, labs and publications', icon: 'flask-conical' },
  { value: 'STARTUP', label: 'Build a startup', description: 'Founding or joining an early-stage startup', icon: 'rocket' },
  { value: 'MS', label: 'MS / higher studies', description: 'Masters or PhD in India or abroad', icon: 'graduation-cap' },
  { value: 'MBA', label: 'MBA', description: 'Management studies after work experience', icon: 'briefcase-business' },
  { value: 'UNDECIDED', label: 'Still exploring', description: "That's completely fine — explore first", icon: 'compass' },
] as const;

export const HELP_VOCAB = [
  'mentorship', 'internships', 'interview prep', 'dsa', 'projects', 'research', 'higher studies', 'mba', 'startups',
  'resume review', 'teammates', 'club guidance', 'campus life', 'referrals', 'open source',
] as const;

export const TARGET_ROLES = [
  'software engineer', 'frontend developer', 'backend developer', 'full stack developer', 'ml engineer', 'data scientist',
  'data analyst', 'quant analyst', 'product manager', 'devops engineer', 'security engineer', 'research engineer',
  'ui/ux designer', 'consultant', 'founder',
] as const;

export const DEPARTMENTS = ['CSE', 'CSE-AI', 'AIE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'AERO', 'BIOTECH', 'MBA', 'Other'] as const; // ⚠️ replace with your college's real departments

export const ROLE_LABELS = { STUDENT: 'Student', SENIOR: 'Senior', ALUMNI: 'Alumni', ADMIN: 'Admin' } as const;

export const OPPORTUNITY_TYPES = [
  { value: 'INTERNSHIP', label: 'Internship', icon: 'briefcase' },
  { value: 'HACKATHON', label: 'Hackathon', icon: 'trophy' },
  { value: 'RESEARCH', label: 'Research', icon: 'flask-conical' },
  { value: 'EVENT', label: 'Event', icon: 'calendar' },
  { value: 'REFERRAL', label: 'Referral', icon: 'user-check' },
  { value: 'STUDY_GROUP', label: 'Study group', icon: 'users' },
  { value: 'COLLABORATION', label: 'Collaboration', icon: 'handshake' },
  { value: 'CAREER_GUIDANCE', label: 'Career guidance', icon: 'compass' },
] as const;

export const TEAM_KINDS = [
  { value: 'HACKATHON', label: 'Hackathon team' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'STARTUP', label: 'Startup (Founder track)' },
  { value: 'STUDY_CIRCLE', label: 'Study circle' },
] as const;

export const TEAM_ROLES = ['ml engineer', 'frontend', 'backend', 'full stack', 'designer', 'business / pitch', 'data', 'hardware', 'domain expert', 'content'] as const;

export const CLUB_CATEGORIES = ['TECH', 'CULTURAL', 'SPORTS', 'ENTREPRENEURSHIP', 'SOCIAL'] as const;

export const LEVELS = [
  { name: 'Newcomer', min: 0 },
  { name: 'Helper', min: 50 },
  { name: 'Guide', min: 150 },
  { name: 'Mentor', min: 400 },
  { name: 'Legend', min: 1000 },
] as const;

export const BADGES = [
  { slug: 'first-answer', name: 'First Answer', icon: 'message-circle-heart', description: 'Answered a question for the first time', howToEarn: 'Answer any question' },
  { slug: 'answer-machine', name: 'Answer Machine', icon: 'messages-square', description: 'Answered 10 questions', howToEarn: 'Answer 10 questions' },
  { slug: 'trusted-voice', name: 'Trusted Voice', icon: 'shield-check', description: '3 answers marked best', howToEarn: 'Have 3 answers marked best' },
  { slug: 'experience-sharer', name: 'Experience Sharer', icon: 'notebook-pen', description: 'Shared an interview experience', howToEarn: 'Share an interview experience' },
  { slug: 'club-reviewer', name: 'Club Reviewer', icon: 'star', description: 'Reviewed a club honestly', howToEarn: 'Review a club' },
  { slug: 'roadmap-author', name: 'Roadmap Author', icon: 'map', description: 'Published a career roadmap', howToEarn: 'Publish a roadmap' },
  { slug: 'mentor', name: 'Mentor', icon: 'hand-heart', description: 'Completed a mentorship session', howToEarn: 'Complete a mentorship session' },
  { slug: 'bridge-builder', name: 'Bridge Builder', icon: 'waypoints', description: '10 accepted connections', howToEarn: 'Have 10 accepted connections' },
  { slug: 'spotlight', name: 'Spotlight', icon: 'star', description: 'Featured in a success story', howToEarn: 'Be featured in a success story' },
] as const;

export const PREP_CATEGORIES = [
  { value: 'OA', label: 'Online assessment', icon: 'monitor-check' },
  { value: 'APTITUDE', label: 'Aptitude', icon: 'calculator' },
  { value: 'TECHNICAL', label: 'Technical interview', icon: 'cpu' },
  { value: 'HR', label: 'HR interview', icon: 'smile' },
] as const;

export const SIM_ROUNDS = [
  { value: 'APTITUDE', label: 'Aptitude' },
  { value: 'CODING', label: 'Coding (approach)' },
  { value: 'CS_FUNDAMENTALS', label: 'CS fundamentals' },
  { value: 'TECHNICAL', label: 'Technical interview' },
  { value: 'HR', label: 'HR interview' },
] as const;

/** Filter chips on /notifications: group key → label and the notification types it covers. */
export const NOTIFICATION_GROUPS = {
  answers: { label: 'Answers', types: ['ANSWER', 'COMMENT'] },
  requests: { label: 'Requests', types: ['REQUEST', 'REQUEST_RESPONSE'] },
  teams: { label: 'Teams', types: ['APPLICATION'] },
  opportunities: { label: 'Opportunities', types: ['OPPORTUNITY'] },
  badges: { label: 'Badges', types: ['BADGE'] },
} as const;

/** Chat: longest message a person can send. */
export const CHAT_MESSAGE_MAX = 2000;
