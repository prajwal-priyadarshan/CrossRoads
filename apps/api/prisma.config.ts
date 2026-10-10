import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// The CLI (migrate, studio) uses the direct, non-pooled connection. The running app uses
// DATABASE_URL (pooled) through the pg driver adapter in src/lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
});
