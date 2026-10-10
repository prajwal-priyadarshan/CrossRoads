import { useState } from 'react';
import { useParams } from 'react-router';
import { Clock, Rocket } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { APPLICATION_PILL, TEAM_STATUS_PILL } from '@/lib/labels';
import { cn, titleCase } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { ApplicantsList } from './ApplicantsList';
import { ApplyDialog } from './ApplyDialog';
import { MembersList } from './MembersList';
import { useCloseTeam, useJoinTeam, useTeam } from './api';

const KIND_LABEL: Record<string, string> = {
  HACKATHON: 'Hackathon team',
  PROJECT: 'Project',
  STARTUP: 'Founder track',
  STUDY_CIRCLE: 'Study circle',
};

export function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const { data: team, isLoading } = useTeam(id!);
  const [applyOpen, setApplyOpen] = useState(false);
  const join = useJoinTeam(id!);
  const close = useCloseTeam(id!);

  if (isLoading || !team) return <ProfileSkeleton />;

  const canApply = !team.isOwner && !team.myApplication && team.status === 'OPEN' && !team.isFull && !team.openJoin;
  const canJoin = !team.isOwner && !team.myApplication && team.status === 'OPEN' && !team.isFull && team.openJoin;

  return (
    <div className="space-y-5">
      <PageHeader
        title={team.title}
        description={`${KIND_LABEL[team.kind]} · created by ${team.owner.fullName}`}
        actions={
          <>
            {team.kind === 'STARTUP' && (
              <span className="inline-flex items-center gap-1 self-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Rocket className="size-3.5" /> Founder track
              </span>
            )}
            <span className={cn('self-center rounded-full px-2.5 py-0.5 text-xs font-medium', TEAM_STATUS_PILL[team.status])}>
              {titleCase(team.status.toLowerCase())}
            </span>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <p className="whitespace-pre-wrap text-sm">{team.description}</p>

            {team.requiredSkills.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Required skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {team.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        team.skillMatch.includes(s)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-muted',
                      )}
                    >
                      {team.skillMatch.includes(s) ? '✓ ' : ''}
                      {titleCase(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {team.rolesNeeded.length > 0 && (
              <p className="text-sm">
                <span className="text-muted-foreground">Looking for: </span>
                <span className="font-medium text-primary">{team.rolesNeeded.map(titleCase).join(' · ')}</span>
              </p>
            )}

            {(team.commitment || team.schedule || team.meetingDetails) && (
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" />
                {[team.commitment, team.schedule, team.meetingDetails].filter(Boolean).join(' · ')}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Members</p>
              <MembersList members={team.members} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              {canApply && (
                <Button onClick={() => setApplyOpen(true)}>Apply</Button>
              )}
              {canJoin && (
                <Button disabled={join.isPending} onClick={() => join.mutate()}>
                  Join
                </Button>
              )}
              {team.myApplication && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', APPLICATION_PILL[team.myApplication.status])}>
                  {titleCase(team.myApplication.status.toLowerCase())}
                </span>
              )}
              {!team.isOwner && (
                <ConnectDialog
                  recipient={team.owner}
                  defaultKind="CONNECT"
                  defaultMessage={`Hi! I saw your listing for '${team.title}' — could you tell me more?`}
                  trigger={<Button variant="outline">Connect with {team.owner.fullName.split(' ')[0]}</Button>}
                />
              )}
              {team.isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={close.isPending}>
                      {team.status === 'OPEN' ? 'Close listing' : 'Reopen listing'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{team.status === 'OPEN' ? 'Close this listing?' : 'Reopen this listing?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {team.status === 'OPEN'
                          ? 'People will no longer be able to apply or join.'
                          : 'People will be able to apply or join again.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => close.mutate(team.status === 'OPEN' ? 'CLOSED' : 'OPEN')}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {team.isOwner && (
          <aside>
            <Tabs defaultValue="applicants">
              <TabsList>
                <TabsTrigger value="applicants">
                  Applicants
                  {team.pendingCount ? (
                    <span className="tabular ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {team.pendingCount}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="applicants" className="mt-4">
                <ApplicantsList teamId={team.id} applications={team.applications} />
              </TabsContent>
            </Tabs>
          </aside>
        )}
      </div>

      {me && <ApplyDialog team={team} open={applyOpen} onOpenChange={setApplyOpen} />}
    </div>
  );
}
