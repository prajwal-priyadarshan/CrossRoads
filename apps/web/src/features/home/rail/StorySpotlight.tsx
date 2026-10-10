import { Link } from 'react-router';
import type { RailData } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { RailCard } from './RailCard';

export function StorySpotlight({ story }: { story: NonNullable<RailData['spotlight']> }) {
  return (
    <RailCard title="Story spotlight" href="/stories">
      {story.coverUrl && <img src={story.coverUrl} alt="" className="mb-3 aspect-[16/9] w-full rounded-xl object-cover" />}
      <p className="font-semibold">{story.title}</p>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{story.excerpt}</p>
      <Button asChild variant="link" className="mt-1 h-auto px-0">
        <Link to={`/stories/${story.slug}`}>Read story</Link>
      </Button>
    </RailCard>
  );
}
