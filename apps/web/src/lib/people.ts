import type { Role } from '@crossroads/shared';

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th'];

export function yearLabel(role: Role, currentYear: number | null, batchYear?: number | null) {
  if (role === 'ALUMNI') return batchYear ? `Class of ${batchYear}` : 'Alumni';
  return currentYear ? `${ORDINAL[currentYear] ?? `${currentYear}th`} year` : '';
}

/** "CSE-AI · 2nd year" or "ML Engineer @ Northwind Labs" */
export function personSubline(p: {
  role: Role;
  department: string | null;
  currentYear: number | null;
  batchYear?: number | null;
  company: string | null;
  jobTitle: string | null;
}) {
  if (p.company && p.jobTitle) return `${p.jobTitle} @ ${p.company}`;
  if (p.company) return p.company;
  return [p.department, yearLabel(p.role, p.currentYear, p.batchYear)].filter(Boolean).join(' · ');
}

export const CONNECTION_KINDS = {
  CONNECT: { label: 'Connect', hint: 'Stay in touch', pill: 'bg-muted text-muted-foreground' },
  MENTORSHIP: {
    label: 'Mentorship',
    hint: 'Ask for guidance on a specific question',
    pill: 'bg-primary-soft text-primary',
  },
  COLLAB: {
    label: 'Collaborate',
    hint: 'Work on a project together',
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  PEER_GUIDANCE: {
    label: 'Peer guidance',
    hint: 'Learn together with someone at your level',
    pill: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
} as const;

export const STATUS_PILL = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DECLINED: 'bg-muted text-muted-foreground',
  COMPLETED: 'bg-primary-soft text-primary',
} as const;
