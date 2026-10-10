import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma';
import { env } from '../config/env';

const hash = (code: string) => createHash('sha256').update(`${code}:${env.JWT_SECRET}`).digest('hex');

export async function createVerificationCode(email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailCode.deleteMany({ where: { email, purpose: 'VERIFY_EMAIL' } });
  await prisma.emailCode.create({
    data: { email, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  return code;
}

/** Returns 'ok' | 'invalid' | 'expired' | 'locked' */
export async function checkVerificationCode(email: string, code: string) {
  const row = await prisma.emailCode.findFirst({
    where: { email, purpose: 'VERIFY_EMAIL' },
    orderBy: { createdAt: 'desc' },
  });
  if (!row || row.expiresAt < new Date()) return 'expired' as const;
  if (row.attempts >= 5) return 'locked' as const;
  const a = Buffer.from(row.codeHash, 'hex');
  const b = Buffer.from(hash(code), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await prisma.emailCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return 'invalid' as const;
  }
  await prisma.emailCode.deleteMany({ where: { email, purpose: 'VERIFY_EMAIL' } });
  return 'ok' as const;
}
