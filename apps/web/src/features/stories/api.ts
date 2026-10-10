import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { StoryDetail, StoryPage } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useStories = (tag?: string) =>
  useInfiniteQuery({
    queryKey: [...qk.stories, tag ?? 'all'],
    queryFn: ({ pageParam }) => {
      const sp = new URLSearchParams();
      if (tag) sp.set('tag', tag);
      if (pageParam) sp.set('cursor', pageParam);
      return api<StoryPage>(`/stories?${sp}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useStory = (slug: string) =>
  useQuery({ queryKey: qk.story(slug), queryFn: () => api<StoryDetail>(`/stories/${slug}`) });
