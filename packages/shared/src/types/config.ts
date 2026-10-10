import type { Role } from './enums';

/** Public, non-secret settings the web app reads at startup (GET /api/config). */
export type AppConfig = {
  appName: string;
  allowedEmailDomains: string[];
  demoMode: boolean;
  demoAccounts: Array<{ handle: string; fullName: string; role: Role; currentYear: number | null }>;
  aiEnabled: boolean;
};
