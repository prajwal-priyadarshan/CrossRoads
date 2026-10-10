import type { ConnectionKind, ConnectionStatus, GoalTrack, Role } from './enums';

export type Me = {
  id: string;
  email: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  department: string | null;
  batchYear: number | null;
  currentYear: number | null;
  company: string | null;
  jobTitle: string | null;
  bio: string;
  skills: string[];
  interests: string[];
  targetRoles: string[];
  targetCompanies: string[];
  goalTrack: GoalTrack | null;
  canHelpWith: string[];
  lookingFor: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  showEmail: boolean;
  showLinkedin: boolean;
  showGithub: boolean;
  mentorAvailable: boolean;
  mentorTopics: string[];
  mentorSlots: string;
  showOnMentorWall: boolean;
  projects: Project[];
  achievements: string[];
  isVerified: boolean;
  onboarded: boolean;
  points: number;
};

export type UserLite = {
  id: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  currentYear: number | null;
  department: string | null;
  company: string | null;
  jobTitle: string | null;
  isVerified: boolean;
};

export type Match = { score: number; reasons: string[] };

export type PersonCard = {
  id: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  currentYear: number | null;
  department: string | null;
  batchYear: number | null;
  company: string | null;
  jobTitle: string | null;
  isVerified: boolean;
  skills: string[];
  canHelpWith: string[];
  mentorAvailable: boolean;
  mentorSlots: string;
  match: Match;
};

export type MilestoneCategory = 'CLUB' | 'PROJECT' | 'INTERNSHIP' | 'COURSE' | 'ACHIEVEMENT' | 'JOB' | 'STARTUP';
export type Milestone = {
  id: string;
  yearOfStudy: number;
  category: MilestoneCategory;
  title: string;
  description: string;
};
export type Project = { title: string; description: string; url?: string };

export type ConnectionSummary = {
  id: string;
  kind: ConnectionKind;
  status: ConnectionStatus;
  requesterId: string;
} | null;

export type PublicProfile = {
  id: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  department: string | null;
  batchYear: number | null;
  currentYear: number | null;
  company: string | null;
  jobTitle: string | null;
  bio: string;
  skills: string[];
  interests: string[];
  targetRoles: string[];
  goalTrack: GoalTrack | null;
  canHelpWith: string[];
  lookingFor: string[];
  projects: Project[];
  achievements: string[];
  mentorAvailable: boolean;
  mentorTopics: string[];
  mentorSlots: string;
  isVerified: boolean;
  milestones: Milestone[];
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  points: number | null;
  isOwner: boolean;
  match: Match | null;
  connection: ConnectionSummary;
};

export type FollowUp = { id: string; text: string; done: boolean };

export type ConnectionRow = {
  id: string;
  kind: ConnectionKind;
  status: ConnectionStatus;
  message: string;
  topic: string | null;
  followUps: FollowUp[];
  sessionNote: string | null;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
  requesterId: string;
  recipientId: string;
  requester: ContactUser;
  recipient: ContactUser;
};

export type ContactUser = UserLite & {
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
};
