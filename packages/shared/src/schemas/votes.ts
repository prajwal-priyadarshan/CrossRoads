import { z } from 'zod';

export const voteSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().uuid(),
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const bookmarkSchema = z.object({
  targetType: z.enum(['POST', 'EXPERIENCE', 'ROADMAP', 'STORY']),
  targetId: z.string().uuid(),
});

export type VoteInput = z.infer<typeof voteSchema>;
export type BookmarkInput = z.infer<typeof bookmarkSchema>;
