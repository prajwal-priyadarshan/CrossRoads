import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { Me } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useMe = () =>
  useQuery({ queryKey: qk.me, queryFn: () => api<Me | null>('/auth/me'), staleTime: 60_000 });

/** Signs out this device (/auth/logout) or every device (/auth/logout-all, which bumps the session version). */
function useSignOut(path: '/auth/logout' | '/auth/logout-all') {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api(path, { method: 'POST', json: {} }),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(qk.me, null);
      navigate('/');
    },
  });
}

export const useLogout = () => useSignOut('/auth/logout');
export const useLogoutEverywhere = () => useSignOut('/auth/logout-all');
