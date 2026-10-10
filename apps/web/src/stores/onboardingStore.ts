import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { z } from 'zod';
import type { stepAboutSchema, stepSkillsSchema, stepGoalsSchema, stepConnectSchema } from '@bridgeup/shared';

// sessionStorage can throw (private mode, blocked storage); never let that break the wizard.
const safeSession: StateStorage = {
  getItem: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export type Draft = {
  about?: z.input<typeof stepAboutSchema>;
  skills?: z.input<typeof stepSkillsSchema>;
  goals?: z.input<typeof stepGoalsSchema>;
  connect?: z.input<typeof stepConnectSchema>;
};

type State = {
  step: number;
  draft: Draft;
  setStep: (step: number) => void;
  saveStep: <K extends keyof Draft>(key: K, value: NonNullable<Draft[K]>) => void;
  reset: () => void;
};

export const useOnboardingStore = create<State>()(
  persist(
    (set) => ({
      step: 0,
      draft: {},
      setStep: (step) => set({ step }),
      saveStep: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
      reset: () => set({ step: 0, draft: {} }),
    }),
    { name: 'bu-onboarding', storage: createJSONStorage(() => safeSession) },
  ),
);
