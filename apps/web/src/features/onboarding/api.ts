import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Me, OnboardingDraft } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OnboardingDraft) => api<Me>('/me/onboarding', { method: 'PATCH', json: body }),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}
