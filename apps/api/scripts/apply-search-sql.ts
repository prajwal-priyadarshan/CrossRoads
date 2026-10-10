import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, '../prisma/sql/search.sql'), 'utf8');

// Split on semicolons at line ends; our file has no functions or $$ blocks.
const statements = sql
  .split(/;\s*$/m)
  .map((s) => s.replace(/--.*$/gm, '').trim())
  .filter(Boolean);

for (const stmt of statements) {
  await prisma.$executeRawUnsafe(stmt); // static SQL from our own file, no user input
  console.log('✓', stmt.split('\n')[0]!.slice(0, 80));
}
await prisma.$disconnect();
