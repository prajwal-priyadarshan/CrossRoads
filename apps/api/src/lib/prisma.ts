import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Prisma 7 talks to Postgres through a driver adapter; the app uses the pooled DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Neon is a network hop away; a transaction doing several sequential queries (award points,
    // evaluate badges, notify) can exceed Prisma's 5 s default and fail intermittently.
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; // avoid many clients during tsx watch reloads
