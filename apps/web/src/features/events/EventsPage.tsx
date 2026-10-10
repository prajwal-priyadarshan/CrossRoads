import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import type { EventCard } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { ApiError } from '@/lib/api';
import { formatRupees } from '@/lib/money';
import { useEvents, useRsvp } from './api';

const CATEGORY_LABEL: Record<string, string> = {
  CHAPTER_MEET: 'Chapter meet',
  REUNION: 'Reunion',
  WEBINAR: 'Webinar',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function EventRow({ e }: { e: EventCard }) {
  const rsvp = useRsvp();
  const full = e.seatsLeft === 0 && !e.mine;
  const act = () =>
    rsvp.mutate(
      { id: e.id, going: e.mine },
      {
        onSuccess: () => toast.success(e.mine ? 'RSVP cancelled' : 'You are going'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not update your RSVP'),
      },
    );
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
              {CATEGORY_LABEL[e.category] ?? e.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {when(e.startsAt)}
            </span>
            {e.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {e.location}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold">{e.title}</h3>
          <p className="text-sm text-muted-foreground">{e.description}</p>
          <p className="text-xs text-muted-foreground">
            {e.pricePaise === 0 ? 'Free' : `${formatRupees(e.pricePaise)} per ticket (test mode)`}
            {' · '}
            {e.seatsLeft === null ? `${e.rsvpCount} going` : e.seatsLeft === 0 ? 'Full' : `${e.seatsLeft} of ${e.capacity} seats left`}
          </p>
          {e.mine && e.myCode && (
            <p className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
              <Ticket className="size-3.5" /> Ticket {e.myCode}
            </p>
          )}
        </div>
        <Button variant={e.mine ? 'outline' : 'default'} onClick={act} disabled={full || rsvp.isPending} className="sm:w-36">
          {e.mine ? 'Cancel RSVP' : full ? 'Full' : 'RSVP'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EventsPage() {
  const { data, isLoading } = useEvents();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Events</h1>
        <p className="mt-1 text-muted-foreground">Chapter meets, reunions and webinars from your college community.</p>
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState icon={CalendarDays} title="No upcoming events" description="New events will appear here." />
      ) : (
        <div className="space-y-3">
          {data.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
