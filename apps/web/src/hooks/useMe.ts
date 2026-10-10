import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { Me } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useMe = () =>
  useQuery({ queryKey: qk.me, queryFn: () => api<Me | null>('/auth/me'), staleTime: 60_000 });

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST', json: {} }),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(qk.me, null);
      navigate('/');
    },
  });
}
