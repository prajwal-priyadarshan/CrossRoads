import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Me, Milestone, MilestoneInput, ProfileUpdateInput, PublicProfile } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useProfile = (handle: string) =>
  useQuery({ queryKey: qk.user(handle), queryFn: () => api<PublicProfile>(`/users/${handle}`) });

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ProfileUpdateInput) => api<Me>('/me/profile', { method: 'PATCH', json: b }),
    onSuccess: (me) => {
      qc.setQueryData(qk.me, me);
      qc.invalidateQueries({ queryKey: ['user'] });
      qc.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

export function useAddMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: MilestoneInput) => api<Milestone>('/me/milestones', { method: 'POST', json: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user'] }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/me/milestones/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user'] }),
  });
}
