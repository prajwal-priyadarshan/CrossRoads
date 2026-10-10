import { Link, useNavigate } from 'react-router';
import type { PersonCard as Person } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MatchRing } from '@/components/shared/MatchRing';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { personSubline } from '@/lib/people';
import { titleCase } from '@/lib/utils';
import { ConnectDialog } from './ConnectDialog';

export function PersonCard({ person, featured = false }: { person: Person; featured?: boolean }) {
  const navigate = useNavigate();
  const reasons = person.match.reasons.slice(0, 2);
  const extraSkills = Math.max(0, person.skills.length - 3);

  return (
    <article
      onClick={() => navigate(`/u/${person.handle}`)}
      className={`flex h-full cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        featured ? 'bg-gradient-to-br from-primary-soft to-card' : 'bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={person} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/u/${person.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate font-semibold hover:underline"
            >
              {person.fullName}
            </Link>
            {person.isVerified && <VerifiedBadge />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <RoleBadge role={person.role} currentYear={person.currentYear} />
            <span className="truncate text-xs text-muted-foreground">{personSubline(person)}</span>
          </div>
        </div>
        <MatchRing score={person.match.score} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <Tooltip key={r}>
            <TooltipTrigger asChild>
              <span className="max-w-full">
                <ReasonChip>
                  <span className="max-w-[16rem] truncate">{r}</span>
                </ReasonChip>
              </span>
            </TooltipTrigger>
            <TooltipContent>{r}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {person.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {titleCase(s)}
            </span>
          ))}
          {extraSkills > 0 && <span className="text-xs text-muted-foreground">+{extraSkills}</span>}
        </div>
      )}

      {person.canHelpWith.length > 0 && (
        <p className="text-xs text-primary">Can help with {person.canHelpWith.map(titleCase).join(', ')}</p>
      )}

      {person.mentorAvailable && (
        <p className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          Mentor{person.mentorSlots ? ` · ${person.mentorSlots}` : ''}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/u/${person.handle}`}>View profile</Link>
        </Button>
        <ConnectDialog recipient={person} trigger={<Button size="sm">Connect</Button>} />
      </div>
    </article>
  );
}
