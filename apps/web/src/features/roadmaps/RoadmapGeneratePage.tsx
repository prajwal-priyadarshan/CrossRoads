import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router';

export function RoadmapGeneratePage() {
  const navigate = useNavigate();
  const mut = useMutation({
    mutationFn: () => api('/roadmaps/generate', { method: 'POST', json: { goalTrack: 'SOFTWARE_ENGINEERING' } }),
    onSuccess: (res: any) => navigate(`/roadmaps/${res.id || 'success'}`)
  });

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader><CardTitle>Generate My Roadmap</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">Built from alumni roadmaps, journeys, and the companies you are targeting.</p>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Generating...' : 'Generate Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
