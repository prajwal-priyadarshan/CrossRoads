import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { HandHeart } from 'lucide-react';
import type { UserLite } from '@bridgeup/shared';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/shared/UserAvatar';

type MentorRow = { user: UserLite; pointsThisMonth: number };

/** "Thank you, mentors": top seniors/alumni by points this month, opted in via showOnMentorWall. */
export function MentorWall() {
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-wall'],
    queryFn: () => api<MentorRow[]>('/mentor-wall'),
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data?.length) return null;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold">
        <HandHeart className="size-4 text-rose-500" /> Thank you, mentors
      </h2>
      <ul className="space-y-2.5">
        {data.slice(0, 6).map((row) => (
          <li key={row.user.id}>
            <Link to={`/u/${row.user.handle}`} className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-muted">
              <UserAvatar user={row.user} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.user.fullName}</span>
              <span className="tabular shrink-0 text-xs text-muted-foreground">+{row.pointsThisMonth}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
