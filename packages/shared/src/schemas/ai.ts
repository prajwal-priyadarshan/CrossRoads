import { z } from 'zod';

export const aiAnswerOut = z.object({ answer: z.string().min(1).max(1500), citations: z.array(z.number().int()).max(6).default([]) });
export const aiSummaryOut = z.object({ bullets: z.array(z.string()).max(5), citations: z.array(z.number().int()).default([]) });
export const aiRoadmapOut = z.object({
  title: z.string().max(120), summary: z.string().max(800),
  gaps: z.array(z.object({ skill: z.string(), why: z.string().max(300), priority: z.enum(['high', 'medium', 'low']) })).max(10),
  steps: z.array(z.object({ title: z.string().max(120), detail: z.string().max(600), semester: z.number().int().min(1).max(8),
    kind: z.enum(['SKILL', 'PROJECT', 'RESOURCE', 'PRACTICE']), resources: z.array(z.string().max(200)).max(5) })).min(4).max(16),
});
export const aiQuestionOut = z.object({
  format: z.enum(['MCQ', 'SHORT', 'CODING_APPROACH']), topic: z.string(), prompt: z.string().min(10).max(1500),
  options: z.array(z.string()).length(4).optional(), correctIndex: z.number().int().min(0).max(3).optional(),
  explanation: z.string().max(1200),
  rubric: z.array(z.object({ point: z.string().max(200), weight: z.number().min(1).max(5) })).min(3).max(6).optional(),
});
export const aiGradeOut = z.object({ scorePct: z.number().int().min(0).max(100), feedback: z.string().max(600), missing: z.array(z.string()).max(6) });

export const aiPeopleSearchSchema = z.object({ query: z.string().trim().min(2).max(200) });

export const aiPeopleFilterOut = z.object({
  role: z.enum(['STUDENT', 'SENIOR', 'ALUMNI']).optional(),
  department: z.string().max(40).optional(),
  skills: z.array(z.string().max(40)).max(6).default([]),
  interests: z.array(z.string().max(40)).max(6).default([]),
  targetRole: z.string().max(60).optional(),
  company: z.string().max(80).optional(),
  mentorAvailable: z.boolean().default(false),
  summary: z.string().max(160),
});
