import { useParams } from 'react-router';
import { Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PublicPageHeader } from '@/components/layout/PublicPageHeader';
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

  if (isLoading) return <ProfileSkeleton />;
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <PublicPageHeader />
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-bold">Story not found</h1>
          <p className="text-muted-foreground">The story you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Handle both flat StoryDetail ({ ...story, related }) and nested ({ story, related }) responses
  const rawStory = ('story' in (data as any) && (data as any).story ? (data as any).story : data) as any;
  const story = rawStory ?? {};
  const related = (Array.isArray((data as any).related)
    ? (data as any).related
    : Array.isArray(story.related)
      ? story.related
      : []) as any[];
  const tags = Array.isArray(story.tags) ? story.tags : [];

  return (
    <div className="min-h-screen bg-background">
      <PublicPageHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <PageHeader
        title={story.title ?? 'Story Spotlight'}
        actions={story.id ? <ReportButton targetType="STORY" targetId={story.id} /> : null}
      />

      {story.coverUrl && <img src={story.coverUrl} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" />}

      <div className="flex flex-wrap items-center gap-3">
        {story.isSpotlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Star className="size-3" /> Spotlight
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

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t: string) => (
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
    </div>
  );
}
