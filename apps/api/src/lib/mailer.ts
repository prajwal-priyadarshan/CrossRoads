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

/**
 * Harassment / safety report alert, sent to the college's configured safeguarding contact (phase-12 §5).
 * Deliberately does not include the flagged message content — a coordinator reviews that inside the app,
 * where access is restricted and logged, not in an email that could be forwarded or sit in an inbox.
 */
export async function sendSafeguardingAlert(to: string, context: { reporterName: string; targetType: string; reportId: string }) {
  const subject = `Safety report filed: ${context.targetType.toLowerCase()}`;
  const text = `${context.reporterName} filed a safety report on Crossroads (${context.targetType.toLowerCase()}).\n\nReview it in the app: /admin/reports?focus=${context.reportId}\n\nThis email does not include the reported content. Sign in as a safeguarding coordinator to review it.`;
  if (env.EMAIL_MODE === 'console' || !env.RESEND_API_KEY) {
    logger.info(`[DEV] Safeguarding alert to ${to}: ${subject}`);
    return;
  }
  const { Resend } = await import('resend');
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, text });
}
