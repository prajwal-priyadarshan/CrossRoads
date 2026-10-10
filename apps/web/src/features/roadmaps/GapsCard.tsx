import { Link } from 'react-router';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Gap = { skill: string; why: string; priority: 'high' | 'medium' | 'low' };

const PRIORITY_PILL: Record<Gap['priority'], string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-muted text-muted-foreground',
};

export function GapsCard({ gaps }: { gaps: Gap[] }) {
  if (!gaps.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" /> Skills to build first
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/search?q=${encodeURIComponent(g.skill)}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {g.skill}
                </Link>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', PRIORITY_PILL[g.priority])}>
                  {g.priority} priority
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{g.why}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
