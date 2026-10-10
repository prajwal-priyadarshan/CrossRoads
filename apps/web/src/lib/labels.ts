import { titleCase } from './utils';

export const ROUND_TYPE_LABEL: Record<string, string> = {
  APTITUDE: 'Aptitude',
  CODING: 'Coding',
  CS_FUNDAMENTALS: 'CS fundamentals',
  TECHNICAL: 'Technical',
  HR: 'HR',
};

export const ROUND_TYPE_PILL: Record<string, string> = {
  APTITUDE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  CODING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  CS_FUNDAMENTALS: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  TECHNICAL: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  HR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const PREP_CATEGORY_LABEL: Record<string, string> = {
  OA: 'Online assessment',
  APTITUDE: 'Aptitude',
  TECHNICAL: 'Technical interview',
  HR: 'HR interview',
};

export const CLUB_CATEGORY_LABEL: Record<string, string> = {
  TECH: 'Tech',
  CULTURAL: 'Cultural',
  SPORTS: 'Sports',
  ENTREPRENEURSHIP: 'Entrepreneurship',
  SOCIAL: 'Social',
};

export const GOAL_LABEL: Record<string, string> = {
  PRODUCT: 'Product company job',
  SERVICE: 'Service company job',
  QUANT_FINANCE: 'Quant or finance',
  RESEARCH: 'Research',
  STARTUP: 'Build a startup',
  MS: 'MS / higher studies',
  MBA: 'MBA',
  UNDECIDED: 'Still exploring',
};

export const enumLabel = (v: string) => titleCase(v.toLowerCase().replace(/_/g, ' '));
