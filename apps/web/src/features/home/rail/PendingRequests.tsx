import type { RailData } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useRespond } from '@/features/requests/api';
import { CONNECTION_KINDS } from '@/lib/people';
import { RailCard } from './RailCard';

export function PendingRequests({ requests }: { requests: RailData['pendingRequests'] }) {
  const respond = useRespond();
  if (!requests.length) return null;
  return (
    <RailCard title="Requests for you" href="/requests">
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="space-y-2">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={r.requester} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.requester.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <RoleBadge role={r.requester.role} currentYear={r.requester.currentYear} /> ·{' '}
                  {CONNECTION_KINDS[r.kind].label}
                </p>
              </div>
            </div>
            {r.topic && <p className="line-clamp-2 text-xs font-medium">{r.topic}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="h-7" disabled={respond.isPending} onClick={() => respond.mutate({ id: r.id, status: 'ACCEPTED' })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: r.id, status: 'DECLINED' })}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
