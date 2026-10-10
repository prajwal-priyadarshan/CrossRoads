import { z } from 'zod';

const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) : []));

export const peopleQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  department: z.string().optional(),
  role: z.enum(['STUDENT', 'SENIOR', 'ALUMNI']).optional(),
  year: z.coerce.number().int().min(1).max(5).optional(),
  batch: z.coerce.number().int().optional(),
  skills: csv,
  interests: csv,
  targetRole: z.string().optional(),
  company: z.string().optional(),
  mentorAvailable: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  mode: z.enum(['all', 'mentor']).default('all'),
  sort: z.enum(['match', 'helpful', 'newest']).default('match'),
  limit: z.coerce.number().int().min(1).max(60).default(30),
});

export type PeopleQuery = z.output<typeof peopleQuerySchema>;
