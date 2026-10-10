import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { MatchRing } from '@/components/shared/MatchRing';
import { api } from '@/lib/api';

// Temporary placeholder; replaced by the personalized home in Phase 05.
export function HomePage() {
  const [loading, setLoading] = useState(false);

  const ping = async () => {
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; time: string }>('/health');
      toast.success(`API is up (${new Date(res.time).toLocaleTimeString()})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'API unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Welcome to BridgeUp" description="The app shell is ready. Features arrive phase by phase." />
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
        <MatchRing score={82} />
        <ReasonChip>Same department · Placed at a product company</ReasonChip>
        <Button onClick={ping} disabled={loading} className="ml-auto">
          Ping API
        </Button>
      </div>
    </div>
  );
}
