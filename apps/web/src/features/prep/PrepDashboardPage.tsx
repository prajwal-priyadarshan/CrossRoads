import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PrepDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['prep'], queryFn: () => api<any>('/prep/dashboard') });
  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-display font-bold">My Prep</h1>
      <p className="text-muted-foreground">{data.stageCopy}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.readiness?.map((r: any, i: number) => (
          <Card key={i}>
            <CardHeader><CardTitle>Readiness: {r.score}%</CardTitle></CardHeader>
            <CardContent>Skill Match: {r.skill}%</CardContent>
          </Card>
        ))}
      </div>
      
      <h2 className="text-xl font-bold mt-8">Tracks</h2>
      <div className="grid grid-cols-2 gap-4">
        {data.tracks?.map((t: any) => (
          <Card key={t.category}>
            <CardHeader><CardTitle>{t.category}</CardTitle></CardHeader>
            <CardContent>{t.done} of {t.total} tasks completed</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
