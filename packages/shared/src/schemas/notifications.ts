import { z } from 'zod';

/** Filter chips on /notifications; each group maps to notification types in NOTIFICATION_GROUPS. */
export const notificationGroupEnum = z.enum(['answers', 'requests', 'teams', 'opportunities', 'badges']);

export const notificationListQuerySchema = z.object({
  cursor: z.string().optional(),
  group: notificationGroupEnum.optional(),
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const markReadSchema = z
  .object({ ids: z.array(z.string().uuid()).max(100).optional(), all: z.boolean().optional() })
  .refine((v) => v.all === true || (v.ids?.length ?? 0) > 0, {
    message: 'Pass notification ids or all: true',
    path: ['ids'],
  });

export type NotificationListQuery = z.output<typeof notificationListQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
