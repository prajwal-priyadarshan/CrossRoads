import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

/** Brand tones for avatars and tiles: a solid background with a readable text colour, picked stably from an id. */
const BRAND_TONES = [
  { bg: '#1F3028', fg: '#F4F1EA' },
  { bg: '#C4A56A', fg: '#13201A' },
  { bg: '#3E7558', fg: '#F4F1EA' },
  { bg: '#6B5B3E', fg: '#F4F1EA' },
  { bg: '#2F4A5C', fg: '#F4F1EA' },
];

export function brandTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return BRAND_TONES[h % BRAND_TONES.length]!;
}

export const titleCase = (s = '') =>
  s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bAi\b/g, 'AI').replace(/\bMl\b/g, 'ML').replace(/\bDsa\b/g, 'DSA').replace(/\bUi\/Ux\b/g, 'UI/UX');

export const fromNow = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export const isSafeUrl = (u?: string | null) => !!u && /^https?:\/\//i.test(u);
