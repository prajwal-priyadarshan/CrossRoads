import { z } from 'zod';
import { opportunityTypeEnum } from './opportunities';

/**
 * Opportunity alert preferences: a match on any of the three lists notifies the user
 * when someone posts an opportunity. Notifications only — no email or push.
 */
export const alertPrefsSchema = z.object({
  enabled: z.boolean(),
  opportunityTypes: z.array(opportunityTypeEnum).max(8).default([]),
  topicIds: z.array(z.coerce.number().int()).max(6).default([]),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
});

export type AlertPrefsInput = z.infer<typeof alertPrefsSchema>;
