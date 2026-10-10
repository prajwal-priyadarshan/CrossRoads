import type { Draft } from '@/stores/onboardingStore';

export type StepProps<K extends keyof Draft> = {
  formId: string;
  draft: Draft[K];
  onSubmit: (value: NonNullable<Draft[K]>) => void;
  /** Server-side field errors keyed by path, e.g. "about.status" */
  serverErrors?: Record<string, string>;
};
