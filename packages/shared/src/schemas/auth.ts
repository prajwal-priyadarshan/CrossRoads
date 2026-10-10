import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/[0-9]/, 'Include a number');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(60),
  email: emailSchema,
  password: passwordSchema,
});
export const verifySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password') });
export const emailOnlySchema = z.object({ email: emailSchema });
export const demoLoginSchema = z.object({ handle: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
