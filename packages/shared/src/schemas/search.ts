import { z } from 'zod';

export const SEARCH_TYPES = ['all', 'question', 'post', 'opportunity', 'experience', 'team', 'person', 'company', 'story'] as const;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Type at least 2 characters').max(80),
  type: z.enum(SEARCH_TYPES).default('all'),
  topic: z.string().optional(),
  company: z.string().optional(), // company slug (filters experiences and people)
  department: z.string().optional(), // people + authors
  batch: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const feedQuerySchema = z.object({
  tab: z.enum(['foryou', 'latest', 'top']).default('foryou'),
  topic: z.string().optional(),
  cursor: z.string().optional(),
});

export const railQuerySchema = z.object({ visitedClubs: z.coerce.number().int().min(0).max(100).default(0) });
export const bookmarksQuerySchema = z.object({ type: z.enum(['POST', 'EXPERIENCE', 'ROADMAP', 'STORY']).optional() });

export type SearchQuery = z.output<typeof searchQuerySchema>;
export type FeedQuery = z.output<typeof feedQuerySchema>;
