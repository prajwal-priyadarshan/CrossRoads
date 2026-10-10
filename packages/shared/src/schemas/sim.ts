import { z } from 'zod';

export const simStartSchema = z.object({
  companySlug: z.string(),
  roundType: z.enum(['APTITUDE', 'CODING', 'CS_FUNDAMENTALS', 'TECHNICAL', 'HR']),
  maxQuestions: z.number().int().min(3).max(10).default(5),
});
export const simAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(4000),
  selfCheck: z.array(z.number().int()).optional(),
});
