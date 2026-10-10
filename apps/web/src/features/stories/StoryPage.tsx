import { useParams } from 'react-router';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ReportButton } from '@/components/shared/ReportButton';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { titleCase } from '@/lib/utils';
import { StoryCard } from './StoryCard';
import { useStory } from './api';

export function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useStory(slug!);

  if (isLoading || !data) return <ProfileSkeleton />;
  const { related, ...story } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={story.title}
        actions={<ReportButton targetType="STORY" targetId={story.id} />}
      />

      {story.coverUrl && <img src={story.coverUrl} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" />}

      <div className="flex flex-wrap items-center gap-3">
        {story.isSpotlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Sparkles className="size-3" /> Spotlight
          </span>
        )}
        {story.featuredUser && (
          <span className="flex items-center gap-1.5 text-sm">
            <UserAvatar user={story.featuredUser} size="sm" />
            {story.featuredUser.fullName}
          </span>
        )}
        {story.publishedAt && (
          <span className="text-sm text-muted-foreground">
            <RelativeTime iso={story.publishedAt} />
          </span>
        )}
      </div>

      <p className="whitespace-pre-wrap text-base leading-relaxed">{story.body}</p>

      {story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {story.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {titleCase(t)}
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-display text-sm font-semibold">More stories</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
