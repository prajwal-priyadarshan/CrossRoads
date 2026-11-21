import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** `ver` is the user's `sessionVersion` when the token was issued; authOptional rejects it once they differ. */
type Payload = { sub: string; role: string; ver: number };

export const signSession = (userId: string, role: string, sessionVersion: number) =>
  jwt.sign({ sub: userId, role, ver: sessionVersion } satisfies Payload, env.JWT_SECRET, {
    expiresIn: `${env.SESSION_DAYS}d`,
  });

export function verifySession(token: string): Payload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Partial<Payload>;
    if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null;
    return payload as Payload;
  } catch {
    return null;
  }
}
