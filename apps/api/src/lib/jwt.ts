import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type Payload = { sub: string; role: string; ver: 1 };

export const signSession = (userId: string, role: string) =>
  jwt.sign({ sub: userId, role, ver: 1 } satisfies Payload, env.JWT_SECRET, { expiresIn: `${env.SESSION_DAYS}d` });

export function verifySession(token: string): Payload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as Payload;
  } catch {
    return null;
  }
}
