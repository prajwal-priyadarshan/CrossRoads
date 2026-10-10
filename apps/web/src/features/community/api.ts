import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PostCreateInput, PostDetail, PostPage, SimilarQuestion, TopicWithFollow } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export type PostParams = Record<string, string | undefined>;

const toQuery = (params: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const useTopics = () =>
  useQuery({ queryKey: qk.topics, queryFn: () => api<TopicWithFollow[]>('/topics'), staleTime: 5 * 60_000 });

export function useFollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; follow: boolean }) =>
      api(`/topics/${v.id}/follow`, { method: v.follow ? 'POST' : 'DELETE', json: v.follow ? {} : undefined }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.topics });
      const prev = qc.getQueryData<TopicWithFollow[]>(qk.topics);
      qc.setQueryData<TopicWithFollow[]>(qk.topics, (ts) =>
        ts?.map((t) =>
          t.id === v.id ? { ...t, followed: v.follow, followers: t.followers + (v.follow ? 1 : -1) } : t,
        ),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.topics, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.topics });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export const usePosts = (params: PostParams) =>
  useInfiniteQuery({
    queryKey: qk.posts(params),
    queryFn: ({ pageParam }) => api<PostPage>(`/posts${toQuery({ ...params, cursor: pageParam })}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const usePost = (id: string) =>
  useQuery({ queryKey: qk.post(id), queryFn: () => api<PostDetail>(`/posts/${id}`) });

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: PostCreateInput) => api<{ id: string }>('/posts', { method: 'POST', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: qk.topics });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { body: string; parentId?: string }) =>
      api<{ comment: { id: string }; pointsEarned: number }>(`/posts/${postId}/comments`, { method: 'POST', json: b }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.post(postId) });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Post deleted');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useMarkBest(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api(`/posts/${postId}/best-answer`, { method: 'POST', json: { commentId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.post(postId) });
      qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Best answer chosen');
    },
    onError: (e) => toast.error(e.message),
  });
}

export const useSimilarQuestions = (q: string) =>
  useQuery({
    queryKey: qk.similar(q),
    queryFn: () => api<SimilarQuestion[]>(`/questions/similar?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 8,
    staleTime: 60_000,
  });
