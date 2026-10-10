import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AdminAnalytics } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value.toLocaleString('en-IN')}</p>
    </div>
  );
}

function OfficialPostForm() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [body, setBody] = useState('');
  const publish = useMutation({
    mutationFn: () => api<{ id: string }>('/admin/official-posts', { method: 'POST', json: { title, officeName, body } }),
    onSuccess: () => {
      toast.success('Published from the office');
      setTitle('');
      setBody('');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not publish'),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    publish.mutate();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Input value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Office, for example Placement Cell" aria-label="Office name" maxLength={80} />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Post title" maxLength={140} />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details for students" aria-label="Post details" rows={4} maxLength={4000} />
      <Button type="submit" disabled={publish.isPending || officeName.trim().length < 2 || title.trim().length < 5 || !body.trim()}>
        Publish as official
      </Button>
    </form>
  );
}

export function InstitutionPanel() {
  const { data } = useQuery({ queryKey: qk.analytics, queryFn: () => api<AdminAnalytics>('/admin/analytics') });
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Institution overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat label="Students and alumni" value={data.totals.users} />
                <Stat label="Active in the last 30 days" value={data.totals.active30d} />
                <Stat label="Questions in 30 days" value={data.totals.questions30d} />
                <Stat label="Answers in 30 days" value={data.totals.answers30d} />
                <Stat label="Mentorships accepted" value={data.totals.mentorshipsAccepted} />
                <Stat label="Mentorships completed" value={data.totals.mentorshipsCompleted} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">By department</h3>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Department</th>
                        <th className="px-3 py-2 text-right font-medium">Users</th>
                        <th className="px-3 py-2 text-right font-medium">Answers (30 days)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDepartment.map((d) => (
                        <tr key={d.department} className="border-t">
                          <td className="px-3 py-2">{d.department}</td>
                          <td className="px-3 py-2 text-right">{d.users}</td>
                          <td className="px-3 py-2 text-right">{d.answers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post from a college office</CardTitle>
        </CardHeader>
        <CardContent>
          <OfficialPostForm />
        </CardContent>
      </Card>
    </div>
  );
}
