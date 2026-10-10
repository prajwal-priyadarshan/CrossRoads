import { Link } from 'react-router';
import { CheckCircle2, HandHeart, Inbox, MessageSquareText, Star, ThumbsUp, Users } from 'lucide-react';
import type { Me } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAlumniDashboard } from './api';

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function AlumniDashboard({ me }: { me: Me }) {
  const { data, isLoading } = useAlumniDashboard();

  if (isLoading || !data) return <CardSkeleton />;
  const { stats } = data;
  const first = me.fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-[28px]">Welcome back, {first}</h1>
          <p className="mt-1 text-muted-foreground">
            {data.pendingRequests.length > 0
              ? `${stats.pendingRequests} student${stats.pendingRequests === 1 ? ' is' : 's are'} waiting for your reply.`
              : 'No pending requests right now. Here is where your help matters most.'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/ask">
            <MessageSquareText /> Browse questions
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Users} label="Mentees" value={stats.mentees} hint="Students you are guiding" />
        <Stat icon={Inbox} label="Pending" value={stats.pendingRequests} hint="Requests to answer" />
        <Stat icon={MessageSquareText} label="Answers" value={stats.answersGiven} hint="Questions you answered" />
        <Stat icon={Star} label="Best answers" value={stats.bestAnswers} hint="Picked by the asker" />
        <Stat icon={ThumbsUp} label="Helpful votes" value={stats.helpfulVotes} hint="On your answers" />
        <Stat icon={HandHeart} label="Points" value={stats.points} hint="For helping others" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Section
            title="Requests waiting for you"
            action={
              <Button asChild size="sm" variant="ghost">
                <Link to="/requests">See all</Link>
              </Button>
            }
          >
            {data.pendingRequests.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="You are all caught up" description="New mentorship requests will show up here." />
            ) : (
              data.pendingRequests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-start gap-3 rounded-xl border p-3">
                  <UserAvatar user={r.requester} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {r.requester.fullName} <span className="text-xs text-muted-foreground">· {r.kind.replace('_', ' ').toLowerCase()}</span>
                    </div>
                    {r.topic && <div className="text-sm">{r.topic}</div>}
                    <p className="line-clamp-2 text-sm text-muted-foreground">{r.message}</p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <RelativeTime iso={r.createdAt} />
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/requests">Reply</Link>
                  </Button>
                </div>
              ))
            )}
          </Section>

          <Section title="Open questions that match your expertise">
            {data.openQuestions.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title="No open questions in your areas"
                description="Add your expertise on your profile to see matching questions here."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/settings/profile">Update expertise</Link>
                  </Button>
                }
              />
            ) : (
              data.openQuestions.map((q) => (
                <Link key={q.id} to={`/ask/${q.id}`} className="block rounded-xl border p-3 transition hover:bg-muted/50">
                  <div className="font-medium">{q.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Asked by {q.author.fullName}</span>
                    <span>·</span>
                    <RelativeTime iso={q.createdAt} />
                    {q.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Your mentees">
            {data.mentees.length === 0 ? (
              <EmptyState icon={Users} title="No mentees yet" description="Accept a mentorship request to start guiding a student." />
            ) : (
              data.mentees.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <UserAvatar user={m.student} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.student.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.topic ?? m.kind.toLowerCase()}</div>
                  </div>
                </div>
              ))
            )}
          </Section>

          <Section title="Your recent answers">
            {data.recentAnswers.length === 0 ? (
              <EmptyState icon={MessageSquareText} title="No answers yet" description="Answer a question to build your record." />
            ) : (
              data.recentAnswers.map((a) => (
                <Link key={a.id} to={`/ask/${a.postId}`} className="block rounded-xl border p-3 transition hover:bg-muted/50">
                  <div className="line-clamp-1 text-sm font-medium">{a.postTitle}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {a.isBest && <span className="font-medium text-primary">Best answer</span>}
                    <span>{a.score} helpful</span>
                    <span>·</span>
                    <RelativeTime iso={a.createdAt} />
                  </div>
                </Link>
              ))
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}
