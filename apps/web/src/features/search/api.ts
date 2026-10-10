import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchGroup, SearchResults } from '@crossroads/shared';
import {
  Building2,
  BookOpen,
  Briefcase,
  MessageCircleQuestion,
  MessagesSquare,
  NotebookPen,
  Users,
  UsersRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export type SearchParams = Record<string, string | undefined>;

export const useSearch = (params: SearchParams, enabled = true) =>
  useQuery({
    queryKey: qk.search(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
      return api<SearchResults>(`/search?${sp}`);
    },
    enabled: enabled && (params.q?.trim().length ?? 0) >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

/** Display order and metadata for result groups (palette and search page). */
export const GROUPS: { key: SearchGroup; type: string; label: string; icon: typeof Users }[] = [
  { key: 'questions', type: 'question', label: 'Questions', icon: MessageCircleQuestion },
  { key: 'people', type: 'person', label: 'People', icon: Users },
  { key: 'companies', type: 'company', label: 'Companies', icon: Building2 },
  { key: 'experiences', type: 'experience', label: 'Experiences', icon: NotebookPen },
  { key: 'opportunities', type: 'opportunity', label: 'Opportunities', icon: Briefcase },
  { key: 'posts', type: 'post', label: 'Posts', icon: MessagesSquare },
  { key: 'teams', type: 'team', label: 'Teams', icon: UsersRound },
  { key: 'stories', type: 'story', label: 'Stories', icon: BookOpen },
];
