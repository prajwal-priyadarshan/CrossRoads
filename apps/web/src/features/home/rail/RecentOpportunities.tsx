import { Link } from 'react-router';
import { format } from 'date-fns';
import type { RailData } from '@bridgeup/shared';
import { titleCase } from '@/lib/utils';
import { RailCard } from './RailCard';

export function RecentOpportunities({ items }: { items: RailData['opportunities'] }) {
  return (
    <RailCard title="Opportunities" href="/opportunities">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open opportunities right now.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((o) => (
            <li key={o.id}>
              <Link to={`/post/${o.id}`} className="block rounded-lg p-1.5 transition hover:bg-muted">
                <p className="line-clamp-2 text-sm font-medium">{o.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {o.opportunityType && <span>{titleCase(o.opportunityType.toLowerCase().replace(/_/g, ' '))}</span>}
                  {o.organization && <span>· {o.organization}</span>}
                  {o.deadline && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Due {format(new Date(o.deadline), 'd MMM')}
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RailCard>
  );
}
