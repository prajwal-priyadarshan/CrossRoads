import { env } from '../config/env';
import { logger } from './logger';

export async function sendVerificationEmail(to: string, code: string) {
  if (env.EMAIL_MODE === 'console' || !env.RESEND_API_KEY) {
    logger.info(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }
  const { Resend } = await import('resend');
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `${code} is your Crossroads code`,
    text: `Your Crossroads verification code is ${code}. It expires in 10 minutes.`,
  });
}
