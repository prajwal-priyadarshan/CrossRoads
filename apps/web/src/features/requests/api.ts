import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ConnectionCreateInput, ConnectionRow, FollowUp } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export type Box = 'incoming' | 'outgoing' | 'completed';

export const useConnections = (box: Box) =>
  useQuery({ queryKey: qk.connections(box), queryFn: () => api<ConnectionRow[]>(`/connections?box=${box}`) });

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ConnectionCreateInput) => api('/connections', { method: 'POST', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useRespond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: 'ACCEPTED' | 'DECLINED' }) =>
      api(`/connections/${v.id}`, { method: 'PATCH', json: { status: v.status } }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.connections('incoming') });
      const prev = qc.getQueryData<ConnectionRow[]>(qk.connections('incoming'));
      qc.setQueryData<ConnectionRow[]>(qk.connections('incoming'), (rows) =>
        rows?.map((r) => (r.id === v.id ? { ...r, status: v.status } : r)),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.connections('incoming'), ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; sessionNote?: string }) =>
      api(`/connections/${v.id}/complete`, { method: 'POST', json: { sessionNote: v.sessionNote } }),
    onSuccess: () => {
      toast.success('Session marked as completed');
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useFollowUps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; followUps: FollowUp[] }) =>
      api(`/connections/${v.id}/follow-ups`, { method: 'PUT', json: { followUps: v.followUps } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['connections'] }),
    onError: (e) => toast.error(e.message),
  });
}
