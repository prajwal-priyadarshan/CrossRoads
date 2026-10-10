import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { RailCard } from './RailCard';

const QUICK_LINKS = [
  { to: '/settings/profile#skills', label: 'Update skills & interests' },
  { to: '/settings/profile#goals', label: 'Edit my goals' },
  { to: '/opportunities?alerts=1', label: 'Notification settings' },
  { to: '/people?mode=mentor', label: 'Find a mentor' },
];

export function QuickLinks() {
  return (
    <RailCard title="Quick links">
      <ul className="space-y-0.5">
        {QUICK_LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center justify-between rounded-lg p-1.5 text-sm transition hover:bg-muted">
              {l.label}
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
