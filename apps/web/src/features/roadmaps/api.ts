import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { RoadmapCreateInput, RoadmapDetail, RoadmapSummary } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useRoadmaps = (params: { goalTrack?: string; mine?: boolean }) =>
  useQuery({
    queryKey: qk.roadmaps(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.goalTrack) sp.set('goalTrack', params.goalTrack);
      if (params.mine) sp.set('mine', 'true');
      return api<RoadmapSummary[]>(`/roadmaps?${sp}`);
    },
  });

export const useRoadmap = (id: string) =>
  useQuery({ queryKey: qk.roadmap(id), queryFn: () => api<RoadmapDetail>(`/roadmaps/${id}`) });

export function useCreateRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: RoadmapCreateInput) => api<{ id: string; pointsEarned: number }>('/roadmaps', { method: 'POST', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roadmaps'] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useToggleSave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ saved: boolean; saveCount: number }>(`/roadmaps/${id}/save`, { method: 'PUT' }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.roadmap(id) });
      const prev = qc.getQueryData<RoadmapDetail>(qk.roadmap(id));
      if (prev) {
        qc.setQueryData<RoadmapDetail>(qk.roadmap(id), {
          ...prev,
          saved: !prev.saved,
          saveCount: prev.saveCount + (prev.saved ? -1 : 1),
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.roadmap(id), ctx.prev);
      toast.error(e.message);
    },
    onSuccess: (res) => toast.success(res.saved ? 'Roadmap saved' : 'Removed from your roadmaps'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.roadmap(id) });
      qc.invalidateQueries({ queryKey: ['roadmaps'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useToggleStep(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { stepId: string; done: boolean }) =>
      api<{ completedSteps: string[] }>(`/roadmaps/${id}/steps/${encodeURIComponent(v.stepId)}`, {
        method: 'PATCH',
        json: { done: v.done },
      }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.roadmap(id) });
      const prev = qc.getQueryData<RoadmapDetail>(qk.roadmap(id));
      if (prev) {
        const set = new Set(prev.completedSteps);
        if (v.done) set.add(v.stepId);
        else set.delete(v.stepId);
        qc.setQueryData<RoadmapDetail>(qk.roadmap(id), {
          ...prev,
          completedSteps: [...set],
          saved: true,
          saveCount: prev.saved ? prev.saveCount : prev.saveCount + 1,
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.roadmap(id), ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.roadmap(id) });
      qc.invalidateQueries({ queryKey: ['roadmaps'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}
