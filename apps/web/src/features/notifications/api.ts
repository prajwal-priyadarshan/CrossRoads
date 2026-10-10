import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPage } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useUnreadCount = () =>
  useQuery({
    queryKey: qk.unread,
    queryFn: () => api<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30_000,
  });

export type NotificationParams = { group?: string; unread?: boolean };

export const useNotifications = (params: NotificationParams = {}) =>
  useInfiniteQuery({
    queryKey: [...qk.notifications, params],
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams();
      if (params.group) sp.set('group', params.group);
      if (params.unread) sp.set('unread', 'true');
      if (pageParam) sp.set('cursor', pageParam);
      return api<NotificationPage>(`/notifications?${sp}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids?: string[]; all?: boolean }) =>
      api<{ updated: number; count: number }>('/notifications/read', { method: 'POST', json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.unread });
      qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}
