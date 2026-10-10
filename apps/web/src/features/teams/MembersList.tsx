import { Link } from 'react-router';
import type { UserLite } from '@crossroads/shared';
import { UserAvatar } from '@/components/shared/UserAvatar';

/** Compact avatar stack with a member count — used on team cards. */
export function MemberStack({ members, maxMembers }: { members: UserLite[]; maxMembers: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <UserAvatar key={m.id} user={m} size="sm" className="ring-2 ring-background" />
        ))}
      </div>
      <span className="tabular text-xs text-muted-foreground">
        {members.length}/{maxMembers} members
      </span>
    </div>
  );
}

/** Full member list with links to profiles — used on the team detail page. */
export function MembersList({ members }: { members: UserLite[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {members.map((m) => (
        <Link key={m.id} to={`/u/${m.handle}`} className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5 hover:bg-muted">
          <UserAvatar user={m} size="sm" />
          <span className="text-sm font-medium">{m.fullName}</span>
        </Link>
      ))}
    </div>
  );
}
