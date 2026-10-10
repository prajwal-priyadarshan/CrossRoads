import { z } from 'zod';

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(30)
  .regex(/^[a-z0-9+#./ -]+$/, 'Letters, numbers and spaces only');

export const postCreateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('QUESTION'),
    title: z.string().trim().min(10, 'At least 10 characters').max(200),
    body: z.string().trim().max(5000).default(''),
    topicId: z.coerce.number({ invalid_type_error: 'Choose a topic' }).int('Choose a topic'),
    tags: z.array(tag).max(5).default([]),
  }),
  z.object({
    kind: z.literal('DISCUSSION'),
    title: z.string().trim().min(5, 'At least 5 characters').max(200),
    body: z.string().trim().max(10000).default(''),
    topicId: z.coerce.number({ invalid_type_error: 'Choose a topic' }).int('Choose a topic'),
    tags: z.array(tag).max(5).default([]),
  }),
  z.object({
    kind: z.literal('OPPORTUNITY'),
    title: z.string().trim().min(5, 'At least 5 characters').max(200),
    body: z.string().trim().max(5000).default(''),
    topicId: z.coerce.number().int().optional(),
    tags: z.array(tag).max(5).default([]),
    opportunityType: z.enum([
      'INTERNSHIP',
      'HACKATHON',
      'RESEARCH',
      'EVENT',
      'REFERRAL',
      'STUDY_GROUP',
      'COLLABORATION',
      'CAREER_GUIDANCE',
    ]),
    organization: z.string().trim().max(80).optional(),
    deadline: z.coerce.date().optional(),
    externalUrl: z
      .string()
      .url()
      .regex(/^https?:\/\//)
      .optional()
      .or(z.literal('')),
  }),
]);

export const commentCreateSchema = z.object({
  body: z.string().trim().min(2, 'Write a little more').max(5000),
  parentId: z.string().uuid().optional(),
});

export const postListQuerySchema = z.object({
  kind: z.enum(['DISCUSSION', 'QUESTION', 'OPPORTUNITY']).optional(),
  topic: z.string().optional(), // topic slug
  tag: z.string().optional(),
  author: z.string().optional(), // handle
  sort: z.enum(['latest', 'top', 'top_all', 'unanswered']).default('latest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const bestAnswerSchema = z.object({ commentId: z.string().uuid() });

export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type PostListQuery = z.output<typeof postListQuerySchema>;
