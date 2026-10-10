import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventCard } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useEvents = () => useQuery({ queryKey: qk.events, queryFn: () => api<EventCard[]>('/events') });

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, going }: { id: string; going: boolean }) =>
      api<EventCard>(`/events/${id}/rsvp`, { method: going ? 'DELETE' : 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events });
      qc.invalidateQueries({ queryKey: qk.tickets });
    },
  });
}
