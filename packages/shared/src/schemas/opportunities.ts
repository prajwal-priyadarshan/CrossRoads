import { z } from 'zod';

/** Mirrors the Prisma OpportunityType enum; shared with the alert preferences. */
export const opportunityTypeEnum = z.enum([
  'INTERNSHIP',
  'HACKATHON',
  'RESEARCH',
  'EVENT',
  'REFERRAL',
  'STUDY_GROUP',
  'COLLABORATION',
  'CAREER_GUIDANCE',
]);

export const opportunityListQuerySchema = z.object({
  type: opportunityTypeEnum.optional(),
  sort: z.enum(['closing', 'newest']).default('closing'),
  /** Include opportunities whose deadline has passed */
  showPast: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  cursor: z.string().optional(),
});

export type OpportunityListQuery = z.output<typeof opportunityListQuerySchema>;
