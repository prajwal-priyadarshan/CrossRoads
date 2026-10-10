import { useQuery } from '@tanstack/react-query';
import type { PathTwins } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const usePathTwins = () => useQuery({ queryKey: qk.twins, queryFn: () => api<PathTwins>('/path-twins') });
