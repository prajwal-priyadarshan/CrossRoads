import { InstitutionPanel } from './InstitutionPanel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function AdminReports() {
  const qc = useQueryClient();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api<any[]>('/admin/reports?status=OPEN')
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'REMOVE' | 'DISMISS' }) => api(`/admin/reports/${id}`, { method: 'PATCH', json: { action } }),
    onSuccess: () => {
      toast.success('Report resolved');
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    }
  });

  if (isLoading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Open Reports</h2>
      {reports?.length === 0 && <p className="text-muted-foreground">No open reports. Great job community!</p>}
      {reports?.map(r => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base">{r.reason} on {r.targetType}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Reported by: {r.reporter.fullName}</p>
            {r.details && <p className="text-sm italic">"{r.details}"</p>}
            {r.targetPreview && (
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
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="destructive" onClick={() => resolve.mutate({ id: r.id, action: 'REMOVE' })}>Remove Content</Button>
              <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, action: 'DISMISS' })}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-display font-bold mb-6">Admin Panel</h1>
      <InstitutionPanel />
      <div className="mt-10">
        <AdminReports />
      </div>
    </div>
  );
}
