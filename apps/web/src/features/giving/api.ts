import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CampaignCard, CampaignDetail, DonateInput, DonationReceipt } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useCampaigns = () =>
  useQuery({ queryKey: qk.campaigns, queryFn: () => api<CampaignCard[]>('/giving/campaigns') });

export const useCampaign = (slug: string) =>
  useQuery({ queryKey: qk.campaign(slug), queryFn: () => api<CampaignDetail>(`/giving/campaigns/${slug}`), enabled: Boolean(slug) });

export function useDonate(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DonateInput) =>
      api<DonationReceipt>(`/giving/campaigns/${slug}/donate`, { method: 'POST', json: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaign(slug) });
      qc.invalidateQueries({ queryKey: qk.campaigns });
    },
  });
}
