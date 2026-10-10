import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function SimulatorSetupPage() {
  const mut = useMutation({
    mutationFn: () => api('/sim/sessions', { method: 'POST', json: { companySlug: 'demo-corp', roundType: 'APTITUDE', maxQuestions: 5 } }),
    onSuccess: () => alert('Simulator started')
  });

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader><CardTitle>Practice Simulator</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">Questions based on what seniors faced in real campus processes.</p>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Starting...' : 'Start Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
