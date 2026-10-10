import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { LevelProgress } from '@/components/gamification/LevelProgress';

export function Contributions({ handle, points }: { handle: string; isOwner: boolean; points: number | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contributions', handle],
    queryFn: () => api<{ counts: Record<string, number>; helped: number; badges: any[]; recent: any[] }>(`/users/${handle}/contributions`)
  });

  if (isLoading || !data) return null;

  // For students, this is only visible to the owner.
  // For seniors/alumni, points are public so they see it.
  
  return (
    <div className="space-y-6">
      {points !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Level & Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <LevelProgress points={points} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Helped {data.helped} students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.answers}</span><span className="text-muted-foreground">Answers</span></div>
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.bestAnswers}</span><span className="text-muted-foreground">Best Answers</span></div>
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.experiences}</span><span className="text-muted-foreground">Experiences</span></div>
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.reviews}</span><span className="text-muted-foreground">Club Reviews</span></div>
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.roadmaps}</span><span className="text-muted-foreground">Roadmaps</span></div>
            <div className="flex flex-col"><span className="font-semibold text-lg">{data.counts.sessions}</span><span className="text-muted-foreground">Mentor Sessions</span></div>
          </div>
          
          {data.recent.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold">Recent Contributions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {data.recent.map((r: any) => (
                  <li key={r.id} className="flex justify-between">
                    <span className="capitalize">{r.action.replace('_', ' ').toLowerCase()}</span>
                    <span className="text-amber-600 dark:text-amber-400">+{r.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeGrid earnedSlugs={data.badges.map((b: any) => b.slug)} />
        </CardContent>
      </Card>
    </div>
  );
}
