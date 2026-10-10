import { useQuery } from '@tanstack/react-query';
import type { BookmarkList } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useBookmarks = () =>
  useQuery({ queryKey: qk.bookmarks(), queryFn: () => api<BookmarkList>('/bookmarks') });
