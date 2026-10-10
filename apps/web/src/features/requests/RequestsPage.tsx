import { useState } from 'react';
import { Link } from 'react-router';
import { Handshake, Inbox, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { RightRail } from '@/components/layout/RightRail';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { useMe } from '@/hooks/useMe';
import { MentorWall } from '@/components/gamification/MentorWall';
import { useConnections, type Box } from './api';
import { RequestRow } from './RequestRow';

const EMPTY = {
  incoming: {
    icon: Inbox,
    title: 'No requests yet',
    description: 'Complete your profile so people can find you.',
    action: { to: '/settings/profile', label: 'Edit profile' },
  },
  outgoing: {
    icon: Send,
    title: 'Find someone to learn from',
    description: 'Send a connection or mentorship request to start a conversation.',
    action: { to: '/people', label: 'Discover people' },
  },
  completed: {
    icon: Handshake,
    title: 'No completed sessions yet',
    description: 'Finished mentorship sessions will show up here.',
    action: null,
  },
} as const;

function Box({ box, meId }: { box: Box; meId: string }) {
  const { data, isLoading } = useConnections(box);
  if (isLoading) return <ListSkeleton rows={3} />;
  if (!data?.length) {
    const e = EMPTY[box];
    return (
      <EmptyState
        icon={e.icon}
        title={e.title}
        description={e.description}
        action={e.action && <Button asChild><Link to={e.action.to}>{e.action.label}</Link></Button>}
      />
    );
  }
  return (
    <div className="space-y-4">
      {data.map((r) => (
        <RequestRow key={r.id} row={r} meId={meId} />
      ))}
    </div>
  );
}

export function RequestsPage() {
  const { data: me } = useMe();
  const [tab, setTab] = useState<Box>('incoming');
  const incoming = useConnections('incoming');
  const pending = incoming.data?.filter((r) => r.status === 'PENDING').length ?? 0;
  if (!me) return null;

  return (
    <div>
      <PageHeader title="Requests" description="Connections, mentorship and collaboration requests, all in one place." />
      <RightRail rail={<MentorWall />}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Box)}>
          <TabsList>
            <TabsTrigger value="incoming">
              Incoming
              {pending > 0 && (
                <span className="tabular ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          {(['incoming', 'outgoing', 'completed'] as const).map((b) => (
            <TabsContent key={b} value={b} className="mt-6">
              <Box box={b} meId={me.id} />
            </TabsContent>
          ))}
        </Tabs>
      </RightRail>
    </div>
  );
}
