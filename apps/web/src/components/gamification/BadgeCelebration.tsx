import { useEffect, useRef } from 'react';
import { Award } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import type { NotificationItem } from '@crossroads/shared';
import { api } from '@/lib/api';
import { useMarkRead } from '@/features/notifications/api';

/**
 * Celebrates a newly earned badge once: polls for unread BADGE notifications,
 * shows a sparkle toast, then marks it read so it never fires again for the
 * same badge. Mounted once in AppShell so it runs on every authenticated page.
 */
export function BadgeCelebration() {
  const { data } = useQuery({
    queryKey: ['notifications', 'badges-unread'],
    queryFn: () => api<{ items: NotificationItem[] }>('/notifications?group=badges&unread=true'),
    refetchInterval: 30_000,
  });
  const markRead = useMarkRead();
  const celebrated = useRef(new Set<string>());

  useEffect(() => {
    for (const n of data?.items ?? []) {
      if (celebrated.current.has(n.id)) continue;
      celebrated.current.add(n.id);
      toast(n.title, {
        description: n.body,
        icon: <Award className="size-4 text-amber-500" />,
        duration: 6000,
      });
      markRead.mutate({ ids: [n.id] });
    }
    // markRead is stable enough across renders for this one-shot effect; re-running on it would re-fire toasts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return null;
}
