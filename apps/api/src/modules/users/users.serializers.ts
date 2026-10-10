import type { User, Milestone } from '../../generated/prisma/client';
import type { P } from '../../services/matching';

export const userLiteSelect = {
  id: true,
  handle: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  currentYear: true,
  department: true,
  company: true,
  jobTitle: true,
  isVerified: true,
} as const;

type Project = { title: string; description: string; url?: string };
const asProjects = (v: unknown): Project[] => (Array.isArray(v) ? (v as Project[]) : []);

/** Applies the owner's visibility choices. Accepted connections don't override them. */
export function toPublicProfile(u: User & { milestones?: Milestone[] }, viewerId: string) {
  const isOwner = u.id === viewerId;
  return {
    id: u.id,
    handle: u.handle,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    department: u.department,
    batchYear: u.batchYear,
    currentYear: u.currentYear,
    company: u.company,
    jobTitle: u.jobTitle,
    bio: u.bio,
    skills: u.skills,
    interests: u.interests,
    targetRoles: u.targetRoles,
    goalTrack: u.goalTrack,
    canHelpWith: u.canHelpWith,
    lookingFor: u.lookingFor,
    projects: asProjects(u.projects),
    achievements: u.achievements,
    mentorAvailable: u.mentorAvailable,
    mentorTopics: u.mentorTopics,
    mentorSlots: u.mentorSlots,
    isVerified: u.isVerified,
    milestones: (u.milestones ?? []).map((m) => ({
      id: m.id,
      yearOfStudy: m.yearOfStudy,
      category: m.category,
      title: m.title,
      description: m.description,
    })),
    email: isOwner || u.showEmail ? u.email : null,
    linkedinUrl: isOwner || u.showLinkedin ? u.linkedinUrl : null,
    githubUrl: isOwner || u.showGithub ? u.githubUrl : null,
    // points are public only for seniors/alumni (wellbeing rule); owner always sees their own
    points: isOwner || u.role === 'SENIOR' || u.role === 'ALUMNI' ? u.points : null,
    isOwner,
  };
}

/** Maps a Prisma user (or a select of it) to the shape the matcher expects. */
export function asMatchProfile(u: {
  id: string;
  role: string;
  department: string | null;
  currentYear: number | null;
  company: string | null;
  jobTitle: string | null;
  skills: string[];
  interests: string[];
  targetRoles: string[];
  targetCompanies: string[];
  canHelpWith: string[];
  lookingFor: string[];
  projects: unknown;
  mentorAvailable: boolean;
}): P {
  return {
    id: u.id,
    role: u.role,
    department: u.department,
    currentYear: u.currentYear,
    company: u.company,
    jobTitle: u.jobTitle,
    skills: u.skills,
    interests: u.interests,
    targetRoles: u.targetRoles,
    targetCompanies: u.targetCompanies,
    canHelpWith: u.canHelpWith,
    lookingFor: u.lookingFor,
    projects: asProjects(u.projects).map((p) => ({ title: p.title ?? '', description: p.description ?? '' })),
    mentorAvailable: u.mentorAvailable,
  };
}
