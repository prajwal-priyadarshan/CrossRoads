import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';

/**
 * Subscribes to chat events for the signed-in user and refreshes the affected queries.
 * EventSource reconnects by itself; the polling in ./api.ts covers proxies that hold the stream back.
 */
export function useChatStream(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/chat/stream', { withCredentials: true });
    es.addEventListener('chat.message', (e) => {
      try {
        const { conversationId } = JSON.parse((e as MessageEvent).data) as { conversationId: string };
        qc.invalidateQueries({ queryKey: qk.chatConversations });
        qc.invalidateQueries({ queryKey: qk.chatMessages(conversationId) });
      } catch {
        // A malformed event is ignored; the next poll will bring the data in
      }
    });
    return () => es.close();
  }, [enabled, qc]);
}
