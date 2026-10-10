import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PersonCard } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

const toQuery = (params: Record<string, string>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const usePeople = (params: Record<string, string>) =>
  useQuery({
    queryKey: qk.people(params),
    queryFn: () => api<PersonCard[]>(`/people${toQuery(params)}`),
    placeholderData: keepPreviousData,
  });

export const useSuggestedPeople = (enabled = true) =>
  useQuery({
    queryKey: qk.people({ suggested: true }),
    queryFn: () => api<PersonCard[]>('/people/suggested'),
    enabled,
  });
