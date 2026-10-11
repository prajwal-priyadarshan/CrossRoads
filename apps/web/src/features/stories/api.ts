import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { StoryPage } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { getMockStoryBySlug, getMockStoryPage } from './mockStories';

export const useStories = (tag?: string) =>
  useInfiniteQuery({
    queryKey: [...qk.stories, tag ?? 'all'],
    queryFn: async ({ pageParam }) => {
      try {
        const sp = new URLSearchParams();
        if (tag) sp.set('tag', tag);
        if (pageParam) sp.set('cursor', pageParam);
        const res = await api<StoryPage>(`/stories?${sp}`);
        if (res?.items && res.items.length > 0) return res;
        return getMockStoryPage(tag);
      } catch {
        return getMockStoryPage(tag);
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useStory = (slug: string) =>
  useQuery({
    queryKey: qk.story(slug),
    queryFn: async () => {
      try {
        const res = await api<any>(`/stories/${slug}`);
        if (!res) throw new Error('Not found');
        return res;
      } catch (err) {
        const mock = getMockStoryBySlug(slug);
        if (mock) return mock;
        throw err;
      }
    },
  });
