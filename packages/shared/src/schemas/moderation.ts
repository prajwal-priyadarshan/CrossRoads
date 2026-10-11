import { z } from 'zod';

export const reportCreateSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'EXPERIENCE', 'PROFILE', 'TEAM', 'STORY', 'CONVERSATION']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER']),
  details: z.string().trim().max(500).default(''),
});
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

export const reportResolveSchema = z.object({
  action: z.enum(['REMOVE', 'DISMISS'])
});

export const eventUpsertSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(['DEADLINE', 'CLUB', 'EXAM', 'HACKATHON', 'PLACEMENT', 'EVENT', 'REUNION', 'CHAPTER_MEET', 'WEBINAR']),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  link: z.string().url().regex(/^https?:\/\//).optional().or(z.literal('')),
  location: z.string().trim().max(120).optional(),
  audienceYears: z.array(z.number().int().min(1).max(5)).min(1).default([1, 2, 3, 4, 5]),
});

export const adminUserUpdateSchema = z.object({
  isVerified: z.boolean().optional(),
  role: z.enum(['ADMIN', 'ALUMNI', 'SENIOR', 'STUDENT']).optional(),
  // Grants or revokes access to the safeguarding (harassment) report queue and flagged conversation content.
  // Scoped narrowly on purpose — most admins should not have this (phase-12 §5).
  isSafeguardingCoordinator: z.boolean().optional(),
});

export const allowlistSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ALUMNI', 'STUDENT']),
});

export const companyUpsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(['PRODUCT', 'SERVICE', 'STARTUP']),
  description: z.string().trim().max(500).default(''),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  rounds: z.any().optional(),
  skillsTested: z.array(z.string()).default([]),
  prepRoadmap: z.any().optional(),
});

export const clubUpsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['TECH', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'OTHER']),
  description: z.string().trim().max(500).default(''),
  timeCommitment: z.string().trim().max(100).default(''),
  skillsGained: z.array(z.string()).default([]),
  recruitmentMonth: z.string().trim().max(50).default(''),
  joinUrl: z.string().url().optional().nullable().or(z.literal('')),
});
