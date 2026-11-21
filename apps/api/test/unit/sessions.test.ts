import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { signSession } from '../../src/lib/jwt';
import { authOptional } from '../../src/middleware/auth';

vi.mock('../../src/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

const findUnique = prisma.user.findUnique as unknown as Mock;

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  role: 'STUDENT',
  onboarded: true,
  currentYear: 2,
  emailVerified: true,
  isSuspended: false,
  sessionVersion: 2,
  ...overrides,
});

/** Runs authOptional for a request carrying `token` and returns what it put on req.user. */
async function run(token: string | undefined) {
  const req = { cookies: token ? { bu_session: token } : {} } as unknown as Request;
  const next = vi.fn();
  await authOptional(req, {} as Response, next);
  expect(next).toHaveBeenCalledOnce();
  return req.user;
}

describe('authOptional session revocation', () => {
  beforeEach(() => findUnique.mockReset());

  it('accepts a token whose version matches the user', async () => {
    findUnique.mockResolvedValue(dbUser());
    expect(await run(signSession('user-1', 'STUDENT', 2))).toMatchObject({ id: 'user-1', role: 'STUDENT' });
  });

  it('treats a token from before a revocation as signed out', async () => {
    findUnique.mockResolvedValue(dbUser({ sessionVersion: 3 }));
    expect(await run(signSession('user-1', 'STUDENT', 2))).toBeUndefined();
  });

  it('still rejects suspended and unverified users with a current token', async () => {
    findUnique.mockResolvedValue(dbUser({ isSuspended: true }));
    expect(await run(signSession('user-1', 'STUDENT', 2))).toBeUndefined();
    findUnique.mockResolvedValue(dbUser({ emailVerified: false }));
    expect(await run(signSession('user-1', 'STUDENT', 2))).toBeUndefined();
  });

  it('does not query the database without a valid token', async () => {
    expect(await run(undefined)).toBeUndefined();
    expect(await run('not-a-token')).toBeUndefined();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
