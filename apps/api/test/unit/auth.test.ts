import { describe, expect, it } from 'vitest';

// config/env.ts validates process.env once, at import time. dotenv never overwrites a variable that
// is already set, so these win over a local .env and the expectations below hold on any machine.
process.env.ALLOWED_EMAIL_DOMAINS = 'Amrita.edu, college.ac.in';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/crossroads_test';
process.env.JWT_SECRET = 'a'.repeat(64);
process.env.SESSION_DAYS = '7';

// Imported after the environment is in place; nothing here touches the database.
const { isAllowedDomain } = await import('../../src/modules/auth/auth.service');
const { signSession, verifySession } = await import('../../src/lib/jwt');
const { hashPassword, verifyPassword } = await import('../../src/lib/password');
const { emailSchema } = await import('@crossroads/shared');

describe('isAllowedDomain', () => {
  it('accepts every configured domain and their subdomains', () => {
    expect(isAllowedDomain('amrita.edu')).toBe(true);
    expect(isAllowedDomain('am.students.amrita.edu')).toBe(true);
    expect(isAllowedDomain('college.ac.in')).toBe(true);
    expect(isAllowedDomain('cb.college.ac.in')).toBe(true);
  });

  it('rejects a domain that only ends with an allowed one', () => {
    // The dot boundary is what stops someone registering from a look-alike domain.
    expect(isAllowedDomain('notamrita.edu')).toBe(false);
    expect(isAllowedDomain('xamrita.edu')).toBe(false);
    expect(isAllowedDomain('amrita.edu.attacker.com')).toBe(false);
    expect(isAllowedDomain('gmail.com')).toBe(false);
    expect(isAllowedDomain('')).toBe(false);
  });

  it('compares lowercase, which is what the email schema guarantees', () => {
    expect(emailSchema.parse('  Student@AMRITA.EDU  ')).toBe('student@amrita.edu');
    expect(isAllowedDomain(emailSchema.parse(' Student@AM.Students.Amrita.edu ').split('@')[1]!)).toBe(true);
    // Without that normalisation an uppercase domain would not match the configured list.
    expect(isAllowedDomain('AMRITA.EDU')).toBe(false);
  });
});

describe('session tokens', () => {
  it('round-trips the user id and role', () => {
    const payload = verifySession(signSession('user-1', 'SENIOR'));
    expect(payload).toMatchObject({ sub: 'user-1', role: 'SENIOR', ver: 1 });
  });

  it('returns null for a tampered or unparseable token', () => {
    const token = signSession('user-1', 'STUDENT');
    expect(verifySession(`${token}x`)).toBeNull();
    expect(verifySession('not-a-token')).toBeNull();
    expect(verifySession('')).toBeNull();
  });
});

describe('password hashing', () => {
  it('stores a hash, not the password, and only verifies the right one', async () => {
    const hash = await hashPassword('demo12345');
    expect(hash).not.toContain('demo12345');
    expect(await verifyPassword('demo12345', hash)).toBe(true);
    expect(await verifyPassword('demo12346', hash)).toBe(false);
  });

  it('salts, so the same password hashes differently every time', async () => {
    expect(await hashPassword('demo12345')).not.toBe(await hashPassword('demo12345'));
  });
});
