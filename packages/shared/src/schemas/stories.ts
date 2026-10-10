import { z } from 'zod';

export const storyUpsertSchema = z.object({
  title: z.string().trim().min(8).max(140),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80).optional(),
  excerpt: z.string().trim().min(20).max(280),
  body: z.string().trim().min(100).max(20000),
  coverUrl: z.string().url().regex(/^https:\/\//).optional().or(z.literal('')),
  tags: z.array(z.string().trim().toLowerCase()).max(6).default([]),
  featuredUserId: z.string().uuid().optional().nullable(),
  isSpotlight: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});
