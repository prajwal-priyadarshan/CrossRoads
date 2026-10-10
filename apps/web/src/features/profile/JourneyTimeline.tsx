import type { ComponentType } from 'react';
import {
  BookOpen,
  Briefcase,
  Building2,
  Code2,
  Rocket,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import type { Milestone, MilestoneCategory } from '@bridgeup/shared';
import { cn } from '@/lib/utils';

const CATEGORY: Record<MilestoneCategory, { icon: ComponentType<{ className?: string }>; tone: string; label: string }> = {
  CLUB: { icon: Users, tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', label: 'Club' },
  PROJECT: { icon: Code2, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', label: 'Project' },
  INTERNSHIP: { icon: Briefcase, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Internship' },
  COURSE: { icon: BookOpen, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', label: 'Course' },
  ACHIEVEMENT: { icon: Trophy, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', label: 'Achievement' },
  JOB: { icon: Building2, tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', label: 'Job' },
  STARTUP: { icon: Rocket, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', label: 'Startup' },
};

export const MILESTONE_CATEGORIES = Object.entries(CATEGORY).map(([value, v]) => ({ value, label: v.label }));

const yearLabel = (y: number) => (y >= 5 ? 'After graduation' : `Year ${y}`);

export function JourneyTimeline({
  milestones,
  onDelete,
}: {
  milestones: Milestone[];
  onDelete?: (id: string) => void;
}) {
  const years = [...new Set(milestones.map((m) => m.yearOfStudy))].sort((a, b) => a - b);
  return (
    <ol className="space-y-6">
      {years.map((y) => (
        <li key={y}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{yearLabel(y)}</p>
          <ul className="relative space-y-4 border-l-2 border-border pl-6">
            {milestones
              .filter((m) => m.yearOfStudy === y)
              .map((m) => {
                const c = CATEGORY[m.category];
                const Icon = c.icon;
                return (
                  <li key={m.id} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[41px] top-0 grid size-8 place-items-center rounded-full ring-4 ring-card',
                        c.tone,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                      </div>
                      {onDelete && (
                        <button
                          type="button"
                          aria-label={`Delete ${m.title}`}
                          onClick={() => onDelete(m.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
