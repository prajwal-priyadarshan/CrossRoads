import { useQuery } from '@tanstack/react-query';
import type { AlumniDashboard } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useAlumniDashboard = () =>
  useQuery({ queryKey: qk.alumniDashboard, queryFn: () => api<AlumniDashboard>('/alumni/dashboard') });
