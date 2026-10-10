import { Link } from 'react-router';
import type { RailData } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { MatchRing } from '@/components/shared/MatchRing';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { RailCard } from './RailCard';

export function SuggestedPeople({ people }: { people: RailData['suggested'] }) {
  if (!people.length) return null;
  return (
    <RailCard title="People for you" href="/people">
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <UserAvatar user={p} size="md" />
            <div className="min-w-0 flex-1">
              <Link to={`/u/${p.handle}`} className="block truncate text-sm font-semibold hover:underline">
                {p.fullName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{p.match.reasons[0]}</p>
            </div>
            <MatchRing score={p.match.score} size={32} />
            <ConnectDialog
              recipient={p}
              trigger={
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                  Connect
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
