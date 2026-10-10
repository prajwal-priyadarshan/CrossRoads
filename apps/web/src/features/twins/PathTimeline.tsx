import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Briefcase, Building2, Code2, Rocket, Trophy, Users } from 'lucide-react';
import type { MilestoneCategory, TwinMilestone } from '@crossroads/shared';
import { cn } from '@/lib/utils';

export const MILESTONE_STYLE: Record<MilestoneCategory, { icon: ComponentType<{ className?: string }>; tone: string; label: string }> = {
  CLUB: { icon: Users, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300', label: 'Club' },
  PROJECT: { icon: Code2, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Project' },
  INTERNSHIP: { icon: Briefcase, tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', label: 'Internship' },
  COURSE: { icon: BookOpen, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', label: 'Course' },
  ACHIEVEMENT: { icon: Trophy, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', label: 'Achievement' },
  JOB: { icon: Building2, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300', label: 'Job' },
  STARTUP: { icon: Rocket, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', label: 'Startup' },
};

const YEARS = ['1', '2', '3', '4', '5'];
const yearLabel = (y: string) => (y === '5' ? 'After college' : `Year ${y}`);

function Chip({ m }: { m: TwinMilestone }) {
  const s = MILESTONE_STYLE[m.category];
  return (
    <div className={cn('flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium', s.tone)} title={m.description || s.label}>
      <s.icon className="mt-0.5 size-3.5 shrink-0" />
      <span>{m.title}</span>
    </div>
  );
}

/** Five columns on desktop (Year 1 … After college); a vertical timeline on mobile. */
export function PathTimeline({ byYear }: { byYear: Record<string, TwinMilestone[]> }) {
  return (
    <>
      <div className="hidden md:block">
        <div className="relative mb-3 grid grid-cols-5 gap-3">
          <span className="absolute inset-x-0 top-[5px] h-0.5 bg-border" aria-hidden />
          {YEARS.map((y) => (
            <div key={y} className="relative flex flex-col items-start gap-1.5">
              <span className={cn('size-3 rounded-full ring-4 ring-card', byYear[y]?.length ? 'bg-primary' : 'bg-muted')} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{yearLabel(y)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {YEARS.map((y, i) => (
            <motion.div
              key={y}
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              {(byYear[y] ?? []).map((m) => (
                <Chip key={m.id} m={m} />
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      <ol className="space-y-4 border-l-2 pl-4 md:hidden">
        {YEARS.filter((y) => byYear[y]?.length).map((y) => (
          <li key={y} className="relative space-y-2">
            <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-primary ring-4 ring-card" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{yearLabel(y)}</p>
            {byYear[y]!.map((m) => (
              <Chip key={m.id} m={m} />
            ))}
          </li>
        ))}
      </ol>
    </>
  );
}
