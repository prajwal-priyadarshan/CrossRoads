import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { PublicProfile, UserLite } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { MatchRing } from '@/components/shared/MatchRing';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { useMe } from '@/hooks/useMe';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { personSubline } from '@/lib/people';

/** Right-rail card for a post's author, with match reasons and Connect. */
export function AuthorCard({
  author,
  title = 'Posted by',
  connectLabel = 'Connect with the author',
  defaultKind,
  defaultTopic,
}: {
  author: UserLite;
  title?: string;
  connectLabel?: string;
  defaultKind?: 'CONNECT' | 'MENTORSHIP';
  defaultTopic?: string;
}) {
  const { data: me } = useMe();
  const isMe = me?.id === author.id;
  // Reuses the profile query for the match score and reasons
  const { data: profile } = useQuery({
    queryKey: qk.user(author.handle),
    queryFn: () => api<PublicProfile>(`/users/${author.handle}`),
    enabled: !isMe,
  });

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex items-center gap-3">
        <UserAvatar user={author} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/u/${author.handle}`} className="truncate font-semibold hover:underline">
              {author.fullName}
            </Link>
            {author.isVerified && <VerifiedBadge />}
          </div>
          <RoleBadge role={author.role} currentYear={author.currentYear} />
        </div>
        {profile?.match && <MatchRing score={profile.match.score} />}
      </div>
      <p className="text-xs text-muted-foreground">{personSubline({ ...author, batchYear: null })}</p>
      {profile?.match?.reasons.slice(0, 2).map((r) => <ReasonChip key={r}>{r}</ReasonChip>)}
      {!isMe && (
        <ConnectDialog
          recipient={author}
          defaultKind={defaultKind}
          defaultTopic={defaultTopic}
          trigger={<Button className="w-full">{connectLabel}</Button>}
        />
      )}
    </div>
  );
}
