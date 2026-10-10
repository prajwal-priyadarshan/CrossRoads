import { z } from 'zod';

export const guideQuestionSchema = z.object({
  question: z.string().trim().min(3, 'Ask a little more').max(400, 'Keep the question under 400 characters'),
});

export type GuideQuestionInput = z.infer<typeof guideQuestionSchema>;
