import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatConversation, ChatMessage, ChatMessagePage, ChatSendInput } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

/** Fallback refresh. Live updates arrive over the chat stream (useChatStream); polling only covers a dropped stream. */
const POLL_MS = 30_000;

export const useConversations = () =>
  useQuery({
    queryKey: qk.chatConversations,
    queryFn: () => api<ChatConversation[]>('/chat/conversations'),
    refetchInterval: POLL_MS,
  });

export const useMessages = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: qk.chatMessages(id ?? ''),
    enabled: Boolean(id),
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams();
      if (pageParam) sp.set('cursor', pageParam);
      const qs = sp.toString();
      return api<ChatMessagePage>(`/chat/conversations/${id}/messages${qs ? `?${qs}` : ''}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: POLL_MS,
  });

export function useStartConversation() {
  return useMutation({
    mutationFn: (userId: string) => api<{ id: string }>('/chat/conversations', { method: 'POST', json: { userId } }),
  });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ChatSendInput) =>
      api<ChatMessage>(`/chat/conversations/${id}/messages`, { method: 'POST', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chatMessages(id) });
      qc.invalidateQueries({ queryKey: qk.chatConversations });
    },
  });
}

export function useMarkRead(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/chat/conversations/${id}/read`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.chatConversations }),
  });
}
