import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AlertPrefs, AlertPrefsInput, OpportunityPage } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export type OpportunityParams = { type?: string; sort: string; showPast?: boolean };

export const useOpportunities = (params: OpportunityParams) =>
  useInfiniteQuery({
    queryKey: qk.opportunities(params),
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams({ sort: params.sort });
      if (params.type) sp.set('type', params.type);
      if (params.showPast) sp.set('showPast', 'true');
      if (pageParam) sp.set('cursor', pageParam);
      return api<OpportunityPage>(`/opportunities?${sp}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useAlertPrefs = (enabled = true) =>
  useQuery({ queryKey: qk.alerts, queryFn: () => api<AlertPrefs>('/me/alerts'), enabled });

export function useSaveAlertPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: AlertPrefsInput) => api<AlertPrefs>('/me/alerts', { method: 'PUT', json: b }),
    onSuccess: (prefs) => {
      qc.setQueryData(qk.alerts, prefs);
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(prefs.enabled ? 'Alert preferences saved' : 'Opportunity alerts turned off');
    },
    onError: (e) => toast.error(e.message),
  });
}
