import type { GoalTrack, MilestoneCategory, PrepCategory, SimRoundType, UserLite } from './types';

export type CompanyRound = { name: string; type: SimRoundType; description: string };
export type PrepRoadmapItem = { title: string; detail: string; category: PrepCategory };

export type CompanyTile = {
  id: string;
  slug: string;
  name: string;
  description: string;
  roles: string[];
  visitMonth: string | null;
  experienceCount: number;
  alumniCount: number;
};

export type ExperienceRoundView = {
  name: string;
  type: SimRoundType;
  topics: string[];
  difficulty: number;
  notes: string;
};

export type ExperienceCard = {
  id: string;
  role: string;
  year: number;
  rounds: ExperienceRoundView[];
  difficulty: number;
  prepWeeks: number | null;
  resources: string[];
  tips: string;
  outcome: 'SELECTED' | 'NOT_SELECTED' | null;
  isVerified: boolean;
  createdAt: string;
  author: UserLite;
  company: { slug: string; name: string };
  bookmarked: boolean;
};

export type CompanyDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string | null;
  roles: string[];
  rounds: CompanyRound[];
  skillsTested: string[];
  prepRoadmap: PrepRoadmapItem[];
  visitMonth: string | null;
  skills: { tested: string[]; have: string[]; missing: string[] };
  isTarget: boolean;
  stats: { experiences: number; avgDifficulty: number | null; avgPrepWeeks: number | null };
  latestExperiences: ExperienceCard[];
};

export type ClubCategory = 'TECH' | 'CULTURAL' | 'SPORTS' | 'ENTREPRENEURSHIP' | 'SOCIAL';

export type ClubSummary = {
  id: string;
  slug: string;
  name: string;
  category: ClubCategory;
  description: string;
  timeCommitment: string;
  skillsGained: string[];
  recruitmentMonth: string | null;
  joinUrl: string | null;
  reviewCount: number;
  usefulness: number | null;
  timeCost: number | null;
};

export type ClubReview = {
  id: string;
  authorId: string;
  usefulness: number;
  timeCost: number;
  review: string;
  createdAt: string;
  updatedAt: string;
  author: UserLite;
};

export type ClubDetail = ClubSummary & { reviews: ClubReview[]; myReview: ClubReview | null; members: UserLite[] };

export type TwinMilestone = {
  id: string;
  yearOfStudy: number;
  category: MilestoneCategory;
  title: string;
  description: string;
};

export type Twin = {
  person: UserLite & { interests: string[]; goalTrack: GoalTrack | null };
  score: number;
  reasons: string[];
  milestonesByYear: Record<string, TwinMilestone[]>;
};

export type PathTwins = {
  startingPoint: {
    department: string | null;
    interests: string[];
    goalTrack: GoalTrack | null;
    skills: string[];
    currentYear: number | null;
  };
  twins: Twin[];
  year1: Array<{ category: MilestoneCategory; count: number; examples: string[] }>;
  poolSize: number;
};

export type RoadmapStepView = {
  id: string;
  title: string;
  detail: string;
  semester: number;
  kind: 'SKILL' | 'PROJECT' | 'RESOURCE' | 'PRACTICE';
  resources: string[];
};

export type RoadmapSummary = {
  id: string;
  goalTrack: GoalTrack;
  title: string;
  summary: string;
  isAi: boolean;
  saveCount: number;
  createdAt: string;
  author: UserLite | null;
  stepCount: number;
  saved: boolean;
  progress: number;
};

export type RoadmapDetail = RoadmapSummary & {
  steps: RoadmapStepView[];
  mistakes: string[];
  gaps: Array<{ skill: string; why: string; priority: string }>;
  completedSteps: string[];
  isAuthor: boolean;
  bookmarked: boolean;
};
