import { Link } from 'react-router';
import { TrendingUp } from 'lucide-react';
import type { RailData } from '@bridgeup/shared';
import { AppIcon } from '@/components/shared/AppIcon';
import { RailCard } from './RailCard';

export function TrendingTopics({ topics }: { topics: RailData['trending'] }) {
  if (!topics.length) return null;
  return (
    <RailCard title="Trending this week" href="/community">
      <ul className="space-y-1.5">
        {topics.map((t, i) => (
          <li key={t.slug}>
            <Link to={`/community/${t.slug}`} className="flex items-center gap-2.5 rounded-lg p-1.5 text-sm transition hover:bg-muted">
              <span className="tabular w-4 text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <AppIcon name={t.icon} className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="tabular inline-flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3" /> {t.activity} {t.activity === 1 ? 'post' : 'posts'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
