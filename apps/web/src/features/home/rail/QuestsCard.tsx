import { Link } from 'react-router';
import { CheckCircle2, Circle } from 'lucide-react';
import type { RailData } from '@bridgeup/shared';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RailCard } from './RailCard';

function questCopy(done: number, total: number) {
  if (done === total) return "All done. You're a natural!";
  if (done >= total / 2) return "You're settling in well.";
  if (done > 0) return 'Great start!';
  return 'Small steps for your first weeks. Only you can see these.';
}

export function QuestsCard({ quests }: { quests: NonNullable<RailData['quests']> }) {
  return (
    <RailCard title="Your first-year quests">
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{questCopy(quests.done, quests.total)}</span>
          <span className="tabular font-semibold">
            {quests.done} of {quests.total}
          </span>
        </div>
        <Progress value={(quests.done / quests.total) * 100} aria-label="Quest progress" />
      </div>
      <ul className="space-y-1">
        {quests.items.map((q) => (
          <li key={q.id}>
            <Link
              to={q.href}
              className={cn('flex items-start gap-2 rounded-lg p-1.5 text-sm transition hover:bg-muted', q.done && 'text-muted-foreground')}
            >
              {q.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className={cn('block font-medium', q.done && 'line-through')}>{q.label}</span>
                {!q.done && <span className="block text-xs text-muted-foreground">{q.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
