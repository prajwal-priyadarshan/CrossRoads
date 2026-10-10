import { z } from 'zod';

const tag = z.string().trim().toLowerCase().min(1).max(40);
const url = z
  .string()
  .trim()
  .url('Enter a full URL starting with https://')
  .regex(/^https?:\/\//, 'Enter a full URL starting with https://')
  .optional()
  .or(z.literal(''));
const thisYear = new Date().getFullYear();

export const stepAboutSchema = z
  .object({
    status: z.enum(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FINAL_YEAR', 'ALUMNI']),
    department: z.string().min(1, 'Choose your department'),
    batchYear: z.coerce.number().int().min(1990).max(thisYear + 6),
    company: z.string().trim().max(80).optional(),
    jobTitle: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(280).optional(),
  })
  .refine((v) => v.status !== 'ALUMNI' || (v.company && v.jobTitle), {
    message: 'Alumni: add your current company and role',
    path: ['company'],
  });

export const stepSkillsSchema = z.object({
  skills: z.array(tag).min(2, 'Pick at least 2 skills').max(20),
  interests: z.array(tag).min(2, 'Pick at least 2 interests').max(12),
});

export const stepGoalsSchema = z.object({
  goalTrack: z.enum(['PRODUCT', 'SERVICE', 'QUANT_FINANCE', 'RESEARCH', 'STARTUP', 'MS', 'MBA', 'UNDECIDED']),
  targetRoles: z.array(tag).max(5).default([]),
  targetCompanies: z.array(z.string()).max(8).default([]),
  followTopicIds: z.array(z.number().int()).min(1, 'Follow at least one topic'),
});

export const stepConnectSchema = z.object({
  canHelpWith: z.array(tag).max(10).default([]),
  lookingFor: z.array(tag).max(10).default([]),
  linkedinUrl: url,
  githubUrl: url,
  showEmail: z.boolean().default(false),
  showLinkedin: z.boolean().default(true),
  showGithub: z.boolean().default(true),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept to continue' }) }),
});

export const onboardingSchema = z.object({
  about: stepAboutSchema,
  skills: stepSkillsSchema,
  goals: stepGoalsSchema,
  connect: stepConnectSchema,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingDraft = z.input<typeof onboardingSchema>;

// ───────────── Phase 03: profile editing ─────────────
export const projectSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(''),
  url: z
    .string()
    .trim()
    .url()
    .regex(/^https?:\/\//)
    .optional()
    .or(z.literal('')),
});

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(60),
    bio: z.string().trim().max(280).default(''),
    department: z.string().min(1),
    batchYear: z.coerce.number().int().min(1990).max(thisYear + 6),
    company: z.string().trim().max(80).optional().or(z.literal('')),
    jobTitle: z.string().trim().max(80).optional().or(z.literal('')),
    skills: z.array(tag).max(20),
    interests: z.array(tag).max(12),
    targetRoles: z.array(tag).max(5),
    targetCompanies: z.array(z.string()).max(8),
    goalTrack: stepGoalsSchema.shape.goalTrack,
    canHelpWith: z.array(tag).max(10),
    lookingFor: z.array(tag).max(10),
    projects: z.array(projectSchema).max(8),
    achievements: z.array(z.string().trim().min(2).max(120)).max(10),
    linkedinUrl: url,
    githubUrl: url,
    showEmail: z.boolean(),
    showLinkedin: z.boolean(),
    showGithub: z.boolean(),
    mentorAvailable: z.boolean(),
    mentorTopics: z.array(tag).max(8),
    mentorSlots: z.string().trim().max(120).default(''),
    showOnMentorWall: z.boolean(),
  })
  .partial(); // every field optional so sections can be saved independently

export const milestoneSchema = z.object({
  yearOfStudy: z.number().int().min(1).max(5),
  category: z.enum(['CLUB', 'PROJECT', 'INTERNSHIP', 'COURSE', 'ACHIEVEMENT', 'JOB', 'STARTUP']),
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(300).default(''),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
