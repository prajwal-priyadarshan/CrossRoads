import { z } from 'zod';
import { CHAT_MESSAGE_MAX } from '../constants';

export const chatStartSchema = z.object({ userId: z.string().uuid() });
export const chatSendSchema = z.object({
  body: z.string().trim().min(1, 'Write a message').max(CHAT_MESSAGE_MAX, `At most ${CHAT_MESSAGE_MAX} characters`),
});
export const chatIdParamsSchema = z.object({ id: z.string().uuid() });
export const chatMessagesQuerySchema = z.object({ cursor: z.string().optional() });

export type ChatStartInput = z.infer<typeof chatStartSchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
