import { Link } from 'react-router';
import { Route, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { MatchRing } from '@/components/shared/MatchRing';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { GOAL_LABEL } from '@/lib/labels';
import { personSubline } from '@/lib/people';
import { titleCase } from '@/lib/utils';
import { usePathTwins } from './api';
import { MILESTONE_STYLE, PathTimeline } from './PathTimeline';

export function PathTwinsPage() {
  const { data, isLoading } = usePathTwins();
  if (isLoading || !data) return <ProfileSkeleton />;
  const sp = data.startingPoint;

  return (
    <div className="space-y-6">
      <PageHeader title="Path Twins" description="People who started where you are, and where they went." />

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Your starting point</h2>
          <Link to="/settings/profile#skills" className="text-xs font-medium text-primary hover:underline">
            Not right? Update your profile
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {[sp.department, sp.currentYear ? `Year ${sp.currentYear}` : null, sp.goalTrack ? GOAL_LABEL[sp.goalTrack] : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sp.interests.map((i) => (
            <span key={i} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
              {titleCase(i)}
            </span>
          ))}
          {sp.skills.map((s) => (
            <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {titleCase(s)}
            </span>
          ))}
        </div>
      </section>

      {data.twins.length === 0 ? (
        <EmptyState
          icon={Route}
          title="We're still collecting journeys"
          description="Invite seniors to add their milestones so your twins can appear here."
        />
      ) : (
        <>
          {data.twins.map((t) => {
            const first = t.person.fullName.split(' ')[0];
            const now = personSubline({ ...t.person, batchYear: null });
            return (
              <article key={t.person.id} className="space-y-4 rounded-2xl border bg-card p-5">
                <header className="flex flex-wrap items-center gap-3">
                  <UserAvatar user={t.person} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/u/${t.person.handle}`} className="font-semibold hover:underline">
                        {t.person.fullName}
                      </Link>
                      <RoleBadge role={t.person.role} currentYear={t.person.currentYear} />
                    </div>
                    <p className="text-sm text-muted-foreground">Now: {now || 'Final year'}</p>
                  </div>
                  <MatchRing score={t.score} />
                </header>
                {t.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {t.reasons.map((r) => (
                      <ReasonChip key={r}>{r}</ReasonChip>
                    ))}
                  </div>
                )}
                {t.aiInsight && (
                  <p className="flex items-start gap-1.5 rounded-xl bg-primary-soft p-3 text-sm text-primary">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                    {t.aiInsight}
                  </p>
                )}
                <PathTimeline byYear={t.milestonesByYear} />
                <footer className="flex flex-wrap gap-2 border-t pt-4">
                  <ConnectDialog
                    recipient={t.person}
                    defaultKind="MENTORSHIP"
                    defaultTopic={`How did you plan your path from year 1 to ${now || 'final year'}?`.slice(0, 160)}
                    trigger={<Button size="sm">Ask {first} about this path</Button>}
                  />
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/roadmaps?goal=${t.person.goalTrack ?? sp.goalTrack ?? 'PRODUCT'}`}>Turn this into my roadmap</Link>
                  </Button>
                </footer>
              </article>
            );
          })}

          {data.year1.length > 0 && (
            <section className="space-y-3 rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">What your twins did in Year 1</h2>
              <ul className="space-y-2.5">
                {data.year1.map((y) => {
                  const s = MILESTONE_STYLE[y.category];
                  return (
                    <li key={y.category} className="flex items-start gap-3">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${s.tone}`}>
                        <s.icon className="size-4" />
                      </span>
                      <div className="text-sm">
                        <p className="font-medium">
                          {s.label}: <span className="tabular">{y.count}</span> of {data.poolSize} twins
                        </p>
                        <p className="text-muted-foreground">{y.examples.join(' · ')}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
