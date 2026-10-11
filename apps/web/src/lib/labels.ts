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
  CODING: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
  CS_FUNDAMENTALS: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  TECHNICAL: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
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
  SPIRITUAL: 'Spiritual',
  SCIENCE: 'Science',
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

/** Opportunity type → card accent. Labels and icons come from OPPORTUNITY_TYPES in shared. */
export const OPPORTUNITY_TONE: Record<string, string> = {
  INTERNSHIP: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
  HACKATHON: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  RESEARCH: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  EVENT: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  REFERRAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  STUDY_GROUP: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  COLLABORATION: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  CAREER_GUIDANCE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export const TEAM_STATUS_PILL: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  CLOSED: 'bg-muted text-muted-foreground',
};

export const APPLICATION_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  REJECTED: 'bg-muted text-muted-foreground',
};
