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
