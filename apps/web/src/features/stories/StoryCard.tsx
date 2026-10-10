import { Link } from 'react-router';
import { Star } from 'lucide-react';
import type { StorySummary } from '@crossroads/shared';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { titleCase } from '@/lib/utils';

export function StoryCard({ story }: { story: StorySummary }) {
  return (
    <Link
      to={`/stories/${story.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {story.coverUrl && <img src={story.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {story.isSpotlight && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Star className="size-3" /> Spotlight
          </span>
        )}
        <p className="font-semibold leading-snug">{story.title}</p>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{story.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {story.featuredUser ? (
            <span className="flex items-center gap-1.5">
              <UserAvatar user={story.featuredUser} size="sm" />
              {story.featuredUser.fullName}
            </span>
          ) : (
            <span />
          )}
          {story.publishedAt && <RelativeTime iso={story.publishedAt} />}
        </div>
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {story.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {titleCase(t)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
