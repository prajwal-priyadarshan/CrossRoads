import { Link } from 'react-router';
import { HeartHandshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { formatRupees } from '@/lib/money';
import { useCampaigns } from './api';

export const CATEGORY_NAME: Record<string, string> = {
  INFRASTRUCTURE: 'Infrastructure',
  RESEARCH: 'Research',
  SCHOLARSHIPS: 'Scholarships',
};

export function daysLeft(endsAt: string | null) {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 864e5));
}

export function GivingPage() {
  const { data, isLoading } = useCampaigns();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Giving</h1>
        <p className="mt-1 text-muted-foreground">Support infrastructure, research and scholarships at your college.</p>
      </div>
      <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
        Test mode: donations are recorded, but no money is charged yet.
      </p>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState icon={HeartHandshake} title="No campaigns right now" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((c) => {
            const pct = c.goalPaise ? Math.min(100, Math.round((c.raisedPaise / c.goalPaise) * 100)) : 0;
            const left = daysLeft(c.endsAt);
            return (
              <Link key={c.slug} to={`/give/${c.slug}`} className="block">
                <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="space-y-4 p-5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_NAME[c.category] ?? c.category}
                    </span>
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    <Progress value={pct} aria-label={`${pct}% of goal raised`} />
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">{formatRupees(c.raisedPaise)}</span> of{' '}
                        {formatRupees(c.goalPaise)}
                      </span>
                      <span>
                        {c.donorCount} donors{left !== null ? ` · ${left} days left` : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
