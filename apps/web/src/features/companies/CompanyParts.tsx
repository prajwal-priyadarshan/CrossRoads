import { Link } from 'react-router';
import { Check, Circle } from 'lucide-react';
import type { CompanyDetail } from '@bridgeup/shared';
import { Progress } from '@/components/ui/progress';
import { PREP_CATEGORY_LABEL, ROUND_TYPE_LABEL, ROUND_TYPE_PILL } from '@/lib/labels';
import { cn, titleCase } from '@/lib/utils';

/** Horizontal stepper on desktop, vertical list on mobile. */
export function RoundsTimeline({ rounds }: { rounds: CompanyDetail['rounds'] }) {
  return (
    <ol className="flex flex-col gap-4 md:flex-row md:gap-0">
      {rounds.map((r, i) => (
        <li key={i} className="relative flex gap-3 md:flex-1 md:flex-col md:items-center md:px-2 md:text-center">
          {i < rounds.length - 1 && (
            <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 bg-border md:left-[calc(50%+16px)] md:top-4 md:h-0.5 md:w-[calc(100%-32px)]" aria-hidden />
          )}
          <span className="tabular relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {i + 1}
          </span>
          <div className="space-y-1 md:mt-2">
            <p className="font-medium">{r.name}</p>
            <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', ROUND_TYPE_PILL[r.type])}>
              {ROUND_TYPE_LABEL[r.type] ?? r.type}
            </span>
            <p className="text-xs text-muted-foreground">{r.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SkillsYouHave({ skills, slug }: { skills: CompanyDetail['skills']; slug: string }) {
  const total = skills.tested.length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">
          Skills tested: you have <span className="tabular">{skills.have.length}</span> of <span className="tabular">{total}</span>
        </p>
        <Link to={`/roadmaps?goal=PRODUCT&company=${slug}`} className="text-xs font-medium text-primary hover:underline">
          Plan the missing skills
        </Link>
      </div>
      <Progress value={total ? (skills.have.length / total) * 100 : 0} aria-label="Skills you have" />
      <div className="flex flex-wrap gap-1.5">
        {skills.tested.map((s) => {
          const has = skills.have.includes(s);
          return (
            <span
              key={s}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                has ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
              )}
            >
              {has ? <Check className="size-3" /> : <Circle className="size-3" />}
              {titleCase(s)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function PrepRoadmap({ items }: { items: CompanyDetail['prepRoadmap'] }) {
  const cats = ['OA', 'APTITUDE', 'TECHNICAL', 'HR'].filter((c) => items.some((i) => i.category === c));
  return (
    <div className="space-y-5">
      {cats.map((c) => (
        <section key={c}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{PREP_CATEGORY_LABEL[c]}</h3>
          <ul className="space-y-2">
            {items
              .filter((i) => i.category === c)
              .map((i) => (
                <li key={i.title} className="flex items-start gap-2.5 rounded-xl border p-3">
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{i.title}</p>
                    <p className="text-sm text-muted-foreground">{i.detail}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">"Add to my prep" arrives with the placement dashboard.</p>
    </div>
  );
}
