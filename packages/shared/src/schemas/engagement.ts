import { z } from 'zod';

export const donateSchema = z.object({
  amountRupees: z.number().int('Enter a whole amount').min(10, 'The minimum donation is ₹10').max(100000, 'The maximum donation is ₹1,00,000'),
  anonymous: z.boolean().default(false),
  message: z.string().trim().max(200, 'At most 200 characters').default(''),
});

export const officialPostSchema = z.object({
  title: z.string().trim().min(5, 'Add a title').max(140),
  body: z.string().trim().min(1, 'Add the details').max(4000),
  officeName: z.string().trim().min(2, 'Name the office').max(80),
});

export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Enter your password to confirm') });

export type DonateInput = z.infer<typeof donateSchema>;
export type OfficialPostInput = z.infer<typeof officialPostSchema>;
