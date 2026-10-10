import { Link } from 'react-router';
import { Clock, Rocket } from 'lucide-react';
import type { TeamCard as TeamCardType } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { APPLICATION_PILL, TEAM_STATUS_PILL } from '@/lib/labels';
import { cn, titleCase } from '@/lib/utils';
import { MemberStack } from './MembersList';

const KIND_LABEL: Record<TeamCardType['kind'], string> = {
  HACKATHON: 'Hackathon',
  PROJECT: 'Project',
  STARTUP: 'Founder track',
  STUDY_CIRCLE: 'Study circle',
};

export function TeamCard({ team }: { team: TeamCardType }) {
  const isStartup = team.kind === 'STARTUP';
  return (
    <Link
      to={`/teams/${team.id}`}
      className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            isStartup ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-primary-soft text-primary',
          )}
        >
          {isStartup && <Rocket className="size-3" />}
          {KIND_LABEL[team.kind]}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TEAM_STATUS_PILL[team.status])}>
          {titleCase(team.status.toLowerCase())}
        </span>
      </div>

      <div>
        <p className="font-semibold leading-snug">{team.title}</p>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{team.description}</p>
      </div>

      {team.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.requiredSkills.slice(0, 6).map((s) => (
            <span
              key={s}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                team.skillMatch.includes(s) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted',
              )}
            >
              {team.skillMatch.includes(s) ? '✓ ' : ''}
              {titleCase(s)}
            </span>
          ))}
        </div>
      )}

      {team.rolesNeeded.length > 0 && (
        <p className="text-xs">
          <span className="text-muted-foreground">Looking for: </span>
          <span className="font-medium text-primary">{team.rolesNeeded.map(titleCase).join(' · ')}</span>
        </p>
      )}

      {(team.commitment || team.schedule) && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {[team.commitment, team.schedule].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <MemberStack members={team.members} maxMembers={team.maxMembers} />
        {team.myApplicationStatus ? (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', APPLICATION_PILL[team.myApplicationStatus])}>
            {titleCase(team.myApplicationStatus.toLowerCase())}
          </span>
        ) : team.isOwner ? (
          <span className="text-xs font-medium text-muted-foreground">
            {team.pendingCount ? `${team.pendingCount} pending` : 'Your listing'}
          </span>
        ) : (
          <Button size="sm" variant="outline" tabIndex={-1}>
            {team.openJoin ? 'Join' : 'View'}
          </Button>
        )}
      </div>
    </Link>
  );
}
