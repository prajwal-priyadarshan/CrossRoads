import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClubDetail, ClubReviewInput, ClubSummary } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useClubs = (params: { category?: string; sort?: string }) =>
  useQuery({
    queryKey: qk.clubs(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.category) sp.set('category', params.category);
      if (params.sort) sp.set('sort', params.sort);
      return api<ClubSummary[]>(`/clubs?${sp}`);
    },
  });

export const useClub = (slug: string) =>
  useQuery({ queryKey: qk.club(slug), queryFn: () => api<ClubDetail>(`/clubs/${slug}`) });

export function useReviewClub(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ClubReviewInput) =>
      api<{ pointsEarned: number }>(`/clubs/${slug}/review`, { method: 'PUT', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.club(slug) });
      qc.invalidateQueries({ queryKey: ['clubs'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}
