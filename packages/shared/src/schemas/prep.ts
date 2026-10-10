import { z } from 'zod';

export const targetsSchema = z.object({ targetCompanies: z.array(z.string()).max(8), targetRoles: z.array(z.string().trim().toLowerCase()).max(5) });
export const prepItemSchema = z.object({ category: z.enum(['OA', 'APTITUDE', 'TECHNICAL', 'HR']), title: z.string().trim().min(3).max(140), companyId: z.string().uuid().optional() });
export const prepItemUpdateSchema = z.object({ done: z.boolean().optional(), title: z.string().trim().min(3).max(140).optional() });
