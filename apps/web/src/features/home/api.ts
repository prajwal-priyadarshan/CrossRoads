import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { FeedPage, RailData } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export type FeedTab = 'foryou' | 'latest' | 'top';

export const useFeed = (tab: FeedTab, topic?: string) =>
  useInfiniteQuery({
    queryKey: qk.feed(tab, topic),
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams({ tab });
      if (topic) sp.set('topic', topic);
      if (pageParam) sp.set('cursor', pageParam);
      return api<FeedPage>(`/feed?${sp}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

/** Number of clubs opened on this device (written by the club page in Phase 06). */
function visitedClubs() {
  try {
    const v = JSON.parse(storage.get(STORAGE_KEYS.visitedClubs) ?? '[]');
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
}

export const useRail = () =>
  useQuery({
    queryKey: qk.rail,
    queryFn: () => api<RailData>(`/home/rail?visitedClubs=${visitedClubs()}`),
  });
