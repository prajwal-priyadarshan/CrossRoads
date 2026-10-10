import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { ArrowRight, HandHeart, Inbox, MessageCircleQuestion, NotebookPen, Sparkles } from 'lucide-react';
import type { RailData } from '@crossroads/shared';
import { RailCard } from './RailCard';

const WAY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  answer: MessageCircleQuestion,
  requests: Inbox,
  clubs: Sparkles,
  experience: NotebookPen,
};

export function WaysToHelp({ ways }: { ways: NonNullable<RailData['waysToHelp']> }) {
  return (
    <RailCard title="Ways to help today">
      {ways.length === 0 ? (
        <p className="text-sm text-muted-foreground">You're all caught up. Thank you for helping!</p>
      ) : (
        <ul className="space-y-1">
          {ways.map((w) => {
            const Icon = WAY_ICON[w.id] ?? HandHeart;
            return (
              <li key={w.id}>
                <Link to={w.href} className="flex items-center gap-2.5 rounded-lg p-2 text-sm transition hover:bg-muted">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{w.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </RailCard>
  );
}
