import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const usePrepDashboard = () =>
  useQuery({ queryKey: qk.prep, queryFn: () => api<any>('/prep/dashboard') });

export function useUpdateTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetCompanies: string[]; targetRoles: string[] }) =>
      api('/prep/targets', { method: 'PUT', json: body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.prep }); toast.success('Targets saved'); },
    onError: () => toast.error('Could not save targets'),
  });
}

export function useCreatePrepItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { category: string; title: string; companyId?: string }) =>
      api('/prep/items', { method: 'POST', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prep }),
    onError: () => toast.error('Could not add item'),
  });
}

export function useUpdatePrepItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; done?: boolean; title?: string }) =>
      api(`/prep/items/${id}`, { method: 'PATCH', json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prep }),
  });
}

export function useDeletePrepItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/prep/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prep }),
    onError: () => toast.error('Could not delete item'),
  });
}

export function useImportPrepItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => api('/prep/items/import', { method: 'POST', json: { companyId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.prep }); toast.success('Items imported'); },
    onError: () => toast.error('Could not import items'),
  });
}

export function useStartSimulator() {
  return useMutation({
    mutationFn: (body: { companySlug: string; roundType: string; maxQuestions: number }) =>
      api<any>('/sim/sessions', { method: 'POST', json: body }),
    onError: () => toast.error('Could not start simulator'),
  });
}

export const useSimSession = (id: string) =>
  useQuery({
    queryKey: qk.sim(id),
    queryFn: () => api<any>(`/sim/sessions/${id}`),
    enabled: Boolean(id),
    refetchInterval: false,
  });

export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...body }: { sessionId: string; questionId: string; answer: string; selfCheck?: number[] }) =>
      api<any>(`/sim/sessions/${sessionId}/answer`, { method: 'POST', json: body }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: qk.sim(vars.sessionId) }),
    onError: () => toast.error('Could not submit answer'),
  });
}

export function useFinishSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api<any>(`/sim/sessions/${sessionId}/finish`, { method: 'POST' }),
    onSuccess: (_data, sessionId) => qc.invalidateQueries({ queryKey: qk.sim(sessionId) }),
    onError: () => toast.error('Could not finish session'),
  });
}
