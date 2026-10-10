import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { z } from 'zod';
import type { GuideAnswer } from '@crossroads/shared';
import { env, aiEnabled } from '../../config/env';
import { generateJSON } from '../../lib/ai';
import { logger } from '../../lib/logger';

type Chunk = { id: number; file: string; heading: string; text: string; tokens: Map<string, number>; length: number };

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'are', 'you', 'can', 'how', 'what', 'does', 'from', 'into', 'your', 'not', 'but', 'has', 'have', 'its', 'was', 'will', 'use', 'when', 'where', 'which', 'who', 'why', 'is', 'it', 'of', 'to', 'in', 'on', 'be', 'an', 'as', 'or', 'by', 'at']);
const MAX_CHUNK = 1400;
const K1 = 1.4;
const B = 0.75;

const tokenize = (text: string) =>
  text.toLowerCase().match(/[a-z0-9][a-z0-9+#./-]*/g)?.map((t) => t.replace(/[./-]+$/, '')).filter((t) => t.length > 2 && !STOP.has(t)) ?? [];

/** Every markdown file under the docs folder, plus the README above it, split at headings. */
function readDocs(): Array<{ file: string; text: string }> {
  const docsRoot = resolve(process.cwd(), env.PROJECT_DOCS_DIR);
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.md')) files.push(full);
    }
  };
  walk(docsRoot);
  const readme = join(resolve(docsRoot, '..'), 'README.md');
  try {
    statSync(readme);
    files.push(readme);
  } catch {
    // No README next to the docs folder (for example in a slim deployment)
  }
  return files.map((f) => ({ file: relative(resolve(docsRoot, '..'), f), text: readFileSync(f, 'utf8') }));
}

function chunkFile(file: string, text: string): Array<{ file: string; heading: string; text: string }> {
  const out: Array<{ file: string; heading: string; text: string }> = [];
  let heading = file;
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join('\n').trim();
    if (body.length > 40) {
      for (let i = 0; i < body.length; i += MAX_CHUNK) out.push({ file, heading, text: body.slice(i, i + MAX_CHUNK) });
    }
    buf = [];
  };
  for (const line of text.split('\n')) {
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) {
      flush();
      heading = h[1]!.trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

let index: { chunks: Chunk[]; df: Map<string, number>; avgLen: number } | null = null;

/** Built once per process. Keeps the index in memory, so no database or vector store is needed. */
function getIndex() {
  if (index) return index;
  const chunks: Chunk[] = [];
  for (const doc of readDocs()) {
    for (const c of chunkFile(doc.file, doc.text)) {
      const tokens = new Map<string, number>();
      const words = tokenize(`${c.heading} ${c.heading} ${c.text}`);
      for (const w of words) tokens.set(w, (tokens.get(w) ?? 0) + 1);
      chunks.push({ id: chunks.length, file: c.file, heading: c.heading, text: c.text, tokens, length: words.length });
    }
  }
  const df = new Map<string, number>();
  for (const c of chunks) for (const w of c.tokens.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  const avgLen = chunks.reduce((n, c) => n + c.length, 0) / Math.max(1, chunks.length);
  index = { chunks, df, avgLen };
  logger.info({ chunks: chunks.length }, 'project guide index ready');
  return index;
}

/** BM25 ranking over the chunks. Returns the best few with a score above zero. */
export function retrieve(question: string, k = 4) {
  const { chunks, df, avgLen } = getIndex();
  const terms = [...new Set(tokenize(question))];
  if (!terms.length || !chunks.length) return [];
  const scored = chunks.map((c) => {
    let score = 0;
    for (const t of terms) {
      const f = c.tokens.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (chunks.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * c.length) / avgLen)));
    }
    return { c, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x, i) => ({ n: i + 1, file: x.c.file, heading: x.c.heading, excerpt: x.c.text.slice(0, 600), score: Number(x.score.toFixed(2)) }));
}

const ANSWER_PROMPT = `You answer questions about this project using ONLY the numbered sources. Cite the sources you use as [n]. If the sources do not contain the answer, say so plainly. Keep the answer under 180 words. Return only valid JSON with exactly two keys: "answer" (string) and "citations" (array of source numbers).`;

const answerOut = z.object({ answer: z.string().min(1).max(1200), citations: z.array(z.number().int()).max(6).default([]) });

export async function askGuide(question: string): Promise<GuideAnswer> {
  const sources = retrieve(question);
  if (!sources.length) return { status: 'no_match', answer: null, sources: [] };
  if (!aiEnabled) return { status: 'fallback', answer: null, sources };

  try {
    const out = await generateJSON({
      system: ANSWER_PROMPT,
      user: `Question: ${question}\n\nSources:\n${sources.map((s) => `[${s.n}] (${s.file} › ${s.heading}) ${s.excerpt}`).join('\n\n')}`,
      schema: answerOut,
      maxTokens: 700,
    });
    const citations = out.citations.filter((c: number) => sources.some((s) => s.n === c));
    return { status: 'ok', answer: out.answer, citations, sources };
  } catch (err) {
    logger.warn({ err }, 'project guide: AI answer failed, returning sources');
    return { status: 'fallback', answer: null, sources };
  }
}
