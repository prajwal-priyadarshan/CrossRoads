import type { TeamApplicant } from '@crossroads/shared';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { APPLICATION_PILL } from '@/lib/labels';
import { cn, titleCase } from '@/lib/utils';
import { useRespondApplication } from './api';

export function ApplicantsList({ teamId, applications }: { teamId: string; applications: TeamApplicant[] }) {
  const respond = useRespondApplication(teamId);
  if (!applications.length) {
    return <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">No applications yet.</p>;
  }

  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <div key={a.id} className="space-y-2 rounded-2xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={a.applicant} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{a.applicant.fullName}</span>
                <RoleBadge role={a.applicant.role} currentYear={a.applicant.currentYear} />
                {a.crossDepartment && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    Cross-department
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <RelativeTime iso={a.createdAt} />
              </p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', APPLICATION_PILL[a.status])}>
              {titleCase(a.status.toLowerCase())}
            </span>
          </div>

          {a.skillOverlap.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {a.skillOverlap.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check className="size-3" aria-hidden="true" />
                  {titleCase(s)}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">{a.message}</p>

          {a.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ appId: a.id, status: 'ACCEPTED' })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ appId: a.id, status: 'REJECTED' })}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
