import { useQuery } from '@tanstack/react-query';
import type { AppConfig } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

/** Public server settings (email domains, demo accounts, feature flags). Single source of truth: the API env. */
export const useAppConfig = () =>
  useQuery({ queryKey: qk.config, queryFn: () => api<AppConfig>('/config'), staleTime: 10 * 60_000 });

/** Example address for the register form, built from the first allowed domain. */
export const exampleEmail = (cfg?: AppConfig) => (cfg?.allowedEmailDomains[0] ? `name@${cfg.allowedEmailDomains[0]}` : 'your college email');
