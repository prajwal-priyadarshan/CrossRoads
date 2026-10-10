/** Every localStorage / sessionStorage key the app uses, in one place. */
export const STORAGE_KEYS = {
  /** Also read by the inline script in index.html to avoid a dark-mode flash */
  theme: 'bu-theme',
  onboardingDraft: 'bu-onboarding',
  visitedClubs: 'bu-visited-clubs',
  askTipDismissed: 'bu-ask-tip',
} as const;
