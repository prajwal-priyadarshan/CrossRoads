import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { hashPassword, verifyPassword } from '../../lib/password';
import { createVerificationCode, checkVerificationCode } from '../../lib/codes';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../lib/mailer';
import { badRequest, conflict, unauthorized, forbidden, AppError } from '../../lib/errors';
import { slugify } from '../../lib/text';

async function uniqueHandle(fullName: string) {
  const base = slugify(fullName).slice(0, 20) || 'student';
  for (let i = 0; i < 20; i++) {
    const handle = i === 0 ? base : `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    if (!(await prisma.user.findUnique({ where: { handle } }))) return handle;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** True for an allowed domain or any of its subdomains (e.g. am.students.amrita.edu for amrita.edu). */
export function isAllowedDomain(domain: string) {
  return env.ALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

async function allowedRoleFor(email: string) {
  const invite = await prisma.allowedEmail.findUnique({ where: { email } });
  if (invite) return invite.role;
  const domain = email.split('@')[1] ?? '';
  if (isAllowedDomain(domain)) return 'STUDENT' as const;
  if (env.ALUMNI_OPEN_SIGNUP) return 'ALUMNI' as const;
  return null;
}

export async function register(input: { fullName: string; email: string; password: string }) {
  const role = await allowedRoleFor(input.email);
  if (!role) {
    throw badRequest('Use your college email address. Alumni can sign up with a personal email.', {
      email: 'Not a college email address',
    });
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.emailVerified) throw conflict('An account with this email already exists. Please log in.');

  const passwordHash = await hashPassword(input.password);
  const emailVerified = env.AUTO_VERIFY_EMAIL;
  const consentAt = new Date();
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { fullName: input.fullName, passwordHash, emailVerified, consentAt },
    });
  } else {
    await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        handle: await uniqueHandle(input.fullName),
        role,
        emailVerified,
        consentAt,
      },
    });
  }
  if (emailVerified) return { email: input.email, verified: true };
  const code = await createVerificationCode(input.email);
  await sendVerificationEmail(input.email, code);
  return { email: input.email, verified: false };
}

/** Turns a failed code check into the API error the user sees. */
function assertCodeOk(result: Awaited<ReturnType<typeof checkVerificationCode>>) {
  if (result === 'locked') throw new AppError(429, 'RATE_LIMITED', 'Too many wrong codes. Request a new code.');
  if (result === 'expired') throw badRequest('This code has expired. Request a new one.', { code: 'Expired' });
  if (result === 'invalid') {
    throw badRequest('That code is not right. Check your email and try again.', { code: 'Incorrect code' });
  }
}

export async function verify(email: string, code: string) {
  assertCodeOk(await checkVerificationCode(email, code));
  return prisma.user.update({ where: { email }, data: { emailVerified: true } });
}

export async function resend(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const code = await createVerificationCode(email);
    await sendVerificationEmail(email, code);
  }
  // Always succeed so attackers can't learn which emails exist
}

export async function login(email: string, password: string) {
  const normalized = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user && normalized.endsWith('@demo.bridgeup')) {
    user = await prisma.user.findUnique({ where: { email: normalized.replace('@demo.bridgeup', '@demo.crossroads') } });
  } else if (!user && normalized.endsWith('@demo.crossroads')) {
    user = await prisma.user.findUnique({ where: { email: normalized.replace('@demo.crossroads', '@demo.bridgeup') } });
  }
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized('Email or password is incorrect');
  }
  if (!user.emailVerified) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email first');
  return user;
}

export async function demoLogin(handle: string) {
  if (!env.DEMO_MODE) throw forbidden('Demo login is disabled');
  const user = await prisma.user.findUnique({ where: { handle } });
  const isDemo = user && (user.email.endsWith(env.DEMO_EMAIL_SUFFIX) || user.email.endsWith('@demo.crossroads') || user.email.endsWith('@demo.bridgeup'));
  if (!user || !isDemo) throw forbidden('Not a demo account');
  return user;
}

/** Invalidates every session the user has (see sessionVersion in the schema). */
export async function revokeAllSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
}

/** Emails a reset code to verified, active accounts. Callers always answer "ok" so emails can't be probed. */
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true, isSuspended: true } });
  if (!user?.emailVerified || user.isSuspended) return;
  const code = await createVerificationCode(email, 'RESET_PASSWORD');
  await sendPasswordResetEmail(email, code);
}

/** Sets a new password from an emailed code and signs the account out everywhere. Does not start a session. */
export async function resetPassword(input: { email: string; code: string; password: string }) {
  assertCodeOk(await checkVerificationCode(input.email, input.code, 'RESET_PASSWORD'));
  // A code is only issued to an existing account, but it could have been deleted since
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (!user) throw badRequest('This code has expired. Request a new one.', { code: 'Expired' });
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.password), sessionVersion: { increment: 1 } },
  });
}

/** Changes the password of a signed-in user and revokes their other sessions. Returns the updated user. */
export async function changePassword(userId: string, currentPassword: string, password: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw unauthorized('Your current password is not right');
  }
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 } },
  });
}
