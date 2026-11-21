import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { CodePurpose } from '../generated/prisma/client';
import { prisma } from './prisma';
import { env } from '../config/env';

const hash = (code: string) => createHash('sha256').update(`${code}:${env.JWT_SECRET}`).digest('hex');

/** Issues a fresh 6-digit code for `email` and `purpose`, replacing any earlier one for the same purpose. */
export async function createVerificationCode(email: string, purpose: CodePurpose = 'VERIFY_EMAIL') {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailCode.deleteMany({ where: { email, purpose } });
  await prisma.emailCode.create({
    data: { email, purpose, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  return code;
}

/** Returns 'ok' | 'invalid' | 'expired' | 'locked'. A correct code is used up. */
export async function checkVerificationCode(email: string, code: string, purpose: CodePurpose = 'VERIFY_EMAIL') {
  const row = await prisma.emailCode.findFirst({
    where: { email, purpose },
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
  await prisma.emailCode.deleteMany({ where: { email, purpose } });
  return 'ok' as const;
}
