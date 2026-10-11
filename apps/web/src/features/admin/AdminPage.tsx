import { InstitutionPanel } from './InstitutionPanel';
import { SafeguardingCoordinators } from './SafeguardingCoordinators';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

type ConversationPreview = { participants: string[]; messages: { from: string; body: string; at: string }[] };
type Report = {
  id: string;
  reason: string;
  targetType: string;
  reporter: { fullName: string };
  details?: string;
  targetPreview?:
    | { title?: string; excerpt?: string; author?: string; name?: string; handle?: string; body?: string }
    | ConversationPreview
    | null;
};

function isConversationPreview(p: Report['targetPreview']): p is ConversationPreview {
  return !!p && 'messages' in p;
}

function ReportCard({ r, resolve }: { r: Report; resolve: ReturnType<typeof useMutation<unknown, Error, { id: string; action: 'REMOVE' | 'DISMISS' }>> }) {
  const safety = r.reason === 'HARASSMENT';
  return (
    <Card className={safety ? 'border-destructive' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {safety && <ShieldAlert className="h-4 w-4 text-destructive" />}
          {r.reason} on {r.targetType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">Reported by: {r.reporter.fullName}</p>
        {r.details && <p className="text-sm italic">"{r.details}"</p>}

        {isConversationPreview(r.targetPreview) ? (
          <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
            <strong>Conversation between {r.targetPreview.participants.join(' and ')}</strong>
            <p className="text-xs text-muted-foreground">
              Visible to safety coordinators only. Not logged anywhere else.
            </p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto border-t pt-2">
              {r.targetPreview.messages.map((m, i) => (
                <p key={i}>
                  <span className="font-medium">{m.from}:</span> {m.body}
                </p>
              ))}
            </div>
          </div>
        ) : (
          r.targetPreview && (
            <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
              <strong>Reported content</strong>
              {(r.targetPreview as { title?: string }).title && (
                <p className="font-medium">{(r.targetPreview as { title?: string }).title}</p>
              )}
              {(r.targetPreview as { excerpt?: string }).excerpt && (
                <p className="text-muted-foreground">{(r.targetPreview as { excerpt?: string }).excerpt}</p>
              )}
              {(r.targetPreview as { author?: string }).author && (
                <p className="text-xs">by {(r.targetPreview as { author?: string }).author}</p>
              )}
            </div>
          )
        )}

        <div className="flex gap-2 pt-2">
          {r.targetType !== 'CONVERSATION' && (
            <Button size="sm" variant="destructive" onClick={() => resolve.mutate({ id: r.id, action: 'REMOVE' })}>
              Remove Content
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, action: 'DISMISS' })}>
            {safety ? 'Mark reviewed' : 'Dismiss'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminReports() {
  const qc = useQueryClient();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api<Report[]>('/admin/reports?status=OPEN'),
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'REMOVE' | 'DISMISS' }) => api(`/admin/reports/${id}`, { method: 'PATCH', json: { action } }),
    onSuccess: () => {
      toast.success('Report resolved');
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  if (isLoading) return <div>Loading reports...</div>;

  // The API already withholds HARASSMENT reports from non-coordinators, so this split is purely presentational —
  // but it keeps the safety queue visually and spatially separate, per phase-12: never the same urgency as a typo.
  const safety = (reports ?? []).filter((r) => r.reason === 'HARASSMENT');
  const general = (reports ?? []).filter((r) => r.reason !== 'HARASSMENT');

  return (
    <div className="space-y-8">
      {safety.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-destructive">
            <ShieldAlert className="h-6 w-6" /> Safety concerns
          </h2>
          <p className="text-sm text-muted-foreground">
            Harassment and safety reports. Review these first.
          </p>
          {safety.map((r) => (
            <ReportCard key={r.id} r={r} resolve={resolve} />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Content reports</h2>
        {general.length === 0 && <p className="text-muted-foreground">No open reports. Great job community!</p>}
        {general.map((r) => (
          <ReportCard key={r.id} r={r} resolve={resolve} />
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-display font-bold mb-6">Admin Panel</h1>
      <InstitutionPanel />
      <div className="mt-10">
        <SafeguardingCoordinators />
      </div>
      <div className="mt-10">
        <AdminReports />
      </div>
    </div>
  );
}
