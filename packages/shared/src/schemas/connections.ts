import { z } from 'zod';

export const connectionCreateSchema = z
  .object({
    recipientId: z.string().uuid(),
    kind: z.enum(['CONNECT', 'MENTORSHIP', 'COLLAB', 'PEER_GUIDANCE']),
    message: z.string().trim().min(10, 'Write at least 10 characters').max(500),
    topic: z.string().trim().max(160).optional(),
  })
  .refine((v) => !['MENTORSHIP', 'PEER_GUIDANCE'].includes(v.kind) || (v.topic && v.topic.length >= 5), {
    message: 'Add the specific question you want help with',
    path: ['topic'],
  });

export const connectionRespondSchema = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) });
export const completeSchema = z.object({ sessionNote: z.string().trim().max(500).optional() });
export const followUpsSchema = z.object({
  followUps: z
    .array(z.object({ id: z.string(), text: z.string().trim().min(2).max(160), done: z.boolean() }))
    .max(10),
});
export const connectionsQuerySchema = z.object({
  box: z.enum(['incoming', 'outgoing', 'completed']).default('incoming'),
});

export type ConnectionCreateInput = z.infer<typeof connectionCreateSchema>;
