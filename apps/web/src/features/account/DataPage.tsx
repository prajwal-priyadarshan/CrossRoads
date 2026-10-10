import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

/** Your data: download everything the platform holds about you, or delete the account. */
export function DataPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const remove = useMutation({
    mutationFn: () => api('/me', { method: 'DELETE', json: { password } }),
    onSuccess: () => {
      qc.setQueryData(qk.me, null);
      toast.success('Your account and data have been deleted');
      navigate('/');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not delete the account'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Your data</h1>
        <p className="mt-1 text-muted-foreground">
          Your profile details and messages are shared only with people you connect with. You can take a copy or delete it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download a copy</CardTitle>
          <CardDescription>A JSON file with your profile, posts, comments, requests, messages, tickets, donations and points.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/me/export" download>
              <Download /> Download my data
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delete my account</CardTitle>
          <CardDescription>
            This removes your profile, posts, comments, messages, requests and tickets. It cannot be undone. Enter your password to confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            aria-label="Your password"
            autoComplete="current-password"
          />
          <Button variant="destructive" onClick={() => remove.mutate()} disabled={!password || remove.isPending}>
            <Trash2 /> Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
