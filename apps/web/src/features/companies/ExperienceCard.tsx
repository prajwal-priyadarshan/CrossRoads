import { Link } from 'react-router';
import { Lightbulb } from 'lucide-react';
import type { ExperienceCard as Experience } from '@crossroads/shared';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { DifficultyDots } from '@/components/shared/DifficultyDots';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { SelfReportedBadge } from '@/components/shared/SelfReportedBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { useMe } from '@/hooks/useMe';
import { ROUND_TYPE_LABEL, ROUND_TYPE_PILL } from '@/lib/labels';
import { cn, isSafeUrl, titleCase } from '@/lib/utils';

export function ExperienceCard({ exp, showCompany = false }: { exp: Experience; showCompany?: boolean }) {
  const { data: me } = useMe();
  // exp.author is null once that alumnus/senior deletes their account; the experience itself is kept
  const first = exp.author?.fullName.split(' ')[0] ?? 'this person';
  const mine = !!exp.author && me?.id === exp.author.id;

  return (
    <article id={`exp-${exp.id}`} className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-5">
      <header className="flex flex-wrap items-start gap-3">
        {exp.author ? (
          <>
            <UserAvatar user={exp.author} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/u/${exp.author.handle}`} className="font-semibold hover:underline">
                  {exp.author.fullName}
                </Link>
                <RoleBadge role={exp.author.role} currentYear={exp.author.currentYear} />
              </div>
              <p className="text-sm text-muted-foreground">
            {showCompany && (
              <Link to={`/companies/${exp.company.slug}`} className="font-medium text-foreground hover:underline">
                {exp.company.name} ·{' '}
              </Link>
            )}
                {titleCase(exp.role)} · {exp.year}
              </p>
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-muted-foreground">A deleted user</p>
            <p className="text-sm text-muted-foreground">
              {showCompany && (
                <Link to={`/companies/${exp.company.slug}`} className="font-medium text-foreground hover:underline">
                  {exp.company.name} ·{' '}
                </Link>
              )}
              {titleCase(exp.role)} · {exp.year}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {exp.isVerified ? <VerifiedBadge /> : <SelfReportedBadge />}
          <DifficultyDots value={exp.difficulty} />
          {exp.outcome && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                exp.outcome === 'SELECTED'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {exp.outcome === 'SELECTED' ? 'Selected' : 'Not selected'}
            </span>
          )}
        </div>
      </header>

      <Accordion type="multiple" className="rounded-xl border px-3">
        {exp.rounds.map((r, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="gap-2 py-3 hover:no-underline">
              <span className="flex flex-1 flex-wrap items-center gap-2 text-left">
                <span className="tabular text-xs text-muted-foreground">{i + 1}.</span>
                <span className="font-medium">{r.name}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ROUND_TYPE_PILL[r.type])}>
                  {ROUND_TYPE_LABEL[r.type] ?? r.type}
                </span>
                <DifficultyDots value={r.difficulty} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {r.topics.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
              {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {(exp.prepWeeks !== null || exp.resources.length > 0) && (
        <div className="space-y-1.5 text-sm">
          {exp.prepWeeks !== null && <p className="font-medium">Prepared for ~{exp.prepWeeks} weeks</p>}
          {exp.resources.length > 0 && (
            <ul className="list-inside list-disc text-muted-foreground">
              {exp.resources.map((res) => (
                <li key={res} className="break-words">
                  {isSafeUrl(res) ? (
                    <a href={res} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {res}
                    </a>
                  ) : (
                    res
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {exp.tips && (
        <div className="flex gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">Tip from {first}: </span>
            {exp.tips}
          </p>
        </div>
      )}

      <footer className="flex items-center gap-2">
        <BookmarkButton targetType="EXPERIENCE" targetId={exp.id} bookmarked={exp.bookmarked} />
        {exp.author && !mine && (
          <ConnectDialog
            recipient={exp.author}
            defaultKind="MENTORSHIP"
            defaultTopic={`Your ${exp.company.name} ${exp.role} experience`.slice(0, 160)}
            trigger={
              <Button variant="outline" size="sm">
                Ask {first} about this
              </Button>
            }
          />
        )}
      </footer>
    </article>
  );
}
