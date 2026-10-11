import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AdminUserRow = {
  id: string;
  fullName: string;
  handle: string;
  email: string;
  role: string;
  isSafeguardingCoordinator: boolean;
};

/**
 * Grants or revokes access to the safeguarding (harassment) report queue, which includes flagged
 * conversation content — kept separate from the general role/verify tools, scoped narrowly on purpose.
 */
export function SafeguardingCoordinators() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data: users, isFetching } = useQuery({
    queryKey: ['admin', 'users', 'safeguarding-search', q],
    queryFn: () => api<AdminUserRow[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    enabled: q.trim().length >= 2,
  });

  const toggle = useMutation({
    mutationFn: ({ id, isSafeguardingCoordinator }: { id: string; isSafeguardingCoordinator: boolean }) =>
      api(`/admin/users/${id}`, { method: 'PATCH', json: { isSafeguardingCoordinator } }),
    onSuccess: (_d, vars) => {
      toast.success(vars.isSafeguardingCoordinator ? 'Granted safeguarding access' : 'Removed safeguarding access');
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'safeguarding-search'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Safeguarding coordinators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Only coordinators can see harassment reports and flagged conversation content. Search by name, handle or email.
        </p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people..." />
        {isFetching && <p className="text-sm text-muted-foreground">Searching...</p>}
        <div className="divide-y">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.fullName} <span className="text-muted-foreground">@{u.handle}</span></p>
                <p className="truncate text-xs text-muted-foreground">{u.email} · {u.role}</p>
              </div>
              <Button
                size="sm"
                variant={u.isSafeguardingCoordinator ? 'default' : 'outline'}
                onClick={() => toggle.mutate({ id: u.id, isSafeguardingCoordinator: !u.isSafeguardingCoordinator })}
              >
                {u.isSafeguardingCoordinator ? 'Coordinator — remove' : 'Make coordinator'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
