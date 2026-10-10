import { z } from 'zod';

export const teamKindEnum = z.enum(['HACKATHON', 'PROJECT', 'STARTUP', 'STUDY_CIRCLE']);

const skill = z.string().trim().toLowerCase().min(1).max(40);

export const teamCreateSchema = z.object({
  kind: teamKindEnum,
  title: z.string().trim().min(5, 'At least 5 characters').max(100),
  description: z.string().trim().min(20, 'Describe the idea or goal (20+ characters)').max(2000),
  requiredSkills: z.array(skill).max(10).default([]),
  rolesNeeded: z.array(skill).max(8).default([]),
  /** "6 h/week for 4 weeks" */
  commitment: z.string().trim().max(80).default(''),
  maxMembers: z.coerce.number().int().min(2).max(20).default(4),
  /** Where and how the team meets — there are no video calls in the app */
  meetingDetails: z.string().trim().max(300).default(''),
  /** "Tue & Thu 7–8 pm" */
  schedule: z.string().trim().max(120).default(''),
  /** Study circles can let people join instantly */
  openJoin: z.boolean().default(false),
});

export const teamApplySchema = z.object({ message: z.string().trim().min(10, 'At least 10 characters').max(500) });

export const applicationRespondSchema = z.object({ status: z.enum(['ACCEPTED', 'REJECTED']) });

export const teamUpdateSchema = z.object({ status: z.enum(['OPEN', 'CLOSED']) });

export const teamListQuerySchema = z.object({
  kind: teamKindEnum.optional(),
  matchesMe: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  role: z.string().trim().max(40).optional(),
  includeClosed: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;
export type TeamApplyInput = z.infer<typeof teamApplySchema>;
export type ApplicationRespondInput = z.infer<typeof applicationRespondSchema>;
export type TeamListQuery = z.output<typeof teamListQuerySchema>;
