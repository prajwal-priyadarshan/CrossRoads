import { z } from 'zod';

export const GOAL_TRACK_VALUES = ['PRODUCT', 'SERVICE', 'QUANT_FINANCE', 'RESEARCH', 'STARTUP', 'MS', 'MBA', 'UNDECIDED'] as const;

export const roadmapStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3, 'At least 3 characters').max(100),
  detail: z.string().trim().max(600).default(''),
  semester: z.number().int().min(1).max(8),
  kind: z.enum(['SKILL', 'PROJECT', 'RESOURCE', 'PRACTICE']).default('SKILL'),
  resources: z.array(z.string().trim().max(200)).max(5).default([]),
});

export const roadmapCreateSchema = z.object({
  goalTrack: z.enum(GOAL_TRACK_VALUES),
  title: z.string().trim().min(8, 'At least 8 characters').max(120),
  summary: z.string().trim().max(800).default(''),
  steps: z.array(roadmapStepSchema).min(3, 'Add at least 3 steps').max(30),
  mistakes: z.array(z.string().trim().min(3).max(200)).max(8).default([]),
});

export const roadmapListQuerySchema = z.object({
  goalTrack: z.enum(GOAL_TRACK_VALUES).optional(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const roadmapStepToggleSchema = z.object({ done: z.boolean() });

export type RoadmapStep = z.infer<typeof roadmapStepSchema>;
export type RoadmapCreateInput = z.infer<typeof roadmapCreateSchema>;
export type RoadmapListQuery = z.output<typeof roadmapListQuerySchema>;
