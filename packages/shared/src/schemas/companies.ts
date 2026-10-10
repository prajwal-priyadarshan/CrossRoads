import { z } from 'zod';

const thisYear = new Date().getFullYear();
export const ROUND_TYPES = ['APTITUDE', 'CODING', 'CS_FUNDAMENTALS', 'TECHNICAL', 'HR'] as const;

export const experienceRoundSchema = z.object({
  name: z.string().trim().min(2, 'Name this round').max(60), // e.g. "Online assessment"
  type: z.enum(ROUND_TYPES),
  topics: z.array(z.string().trim().toLowerCase().min(1).max(40)).min(1, 'Add at least one topic').max(10),
  difficulty: z.number().int().min(1).max(5),
  notes: z.string().trim().max(600).default(''),
});

export const experienceCreateSchema = z.object({
  companyId: z.string().uuid('Choose a company'),
  role: z.string().trim().min(2, 'Add the role').max(60),
  year: z.number().int().min(thisYear - 4).max(thisYear),
  rounds: z.array(experienceRoundSchema).min(1, 'Add at least one round').max(8),
  difficulty: z.number().int().min(1).max(5),
  prepWeeks: z.number().int().min(0).max(104).optional(),
  resources: z.array(z.string().trim().min(2).max(200)).max(10).default([]),
  tips: z.string().trim().max(1500).default(''),
  outcome: z.enum(['SELECTED', 'NOT_SELECTED', 'WITHHELD']).default('WITHHELD'),
  confidentialityAck: z.literal(true, { errorMap: () => ({ message: 'Please confirm' }) }),
});

export const experienceFilterSchema = z.object({
  year: z.coerce.number().int().optional(),
  role: z.string().optional(),
  minDifficulty: z.coerce.number().int().min(1).max(5).optional(),
  roundType: z.enum(ROUND_TYPES).optional(),
});

export const companyListQuerySchema = z.object({ q: z.string().trim().max(80).optional() });

export type ExperienceRound = z.infer<typeof experienceRoundSchema>;
export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>;
export type ExperienceFilter = z.output<typeof experienceFilterSchema>;
