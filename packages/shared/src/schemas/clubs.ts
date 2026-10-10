import { z } from 'zod';

export const clubReviewSchema = z.object({
  usefulness: z.number().int().min(1).max(5),
  timeCost: z.number().int().min(1).max(5),
  review: z.string().trim().min(20, 'Share a little more (20+ characters)').max(1000),
});

export const clubListQuerySchema = z.object({
  category: z.enum(['TECH', 'CULTURAL', 'SPORTS', 'ENTREPRENEURSHIP', 'SOCIAL']).optional(),
  sort: z.enum(['useful', 'light', 'az']).default('useful'),
});

export type ClubReviewInput = z.infer<typeof clubReviewSchema>;
export type ClubListQuery = z.output<typeof clubListQuerySchema>;
