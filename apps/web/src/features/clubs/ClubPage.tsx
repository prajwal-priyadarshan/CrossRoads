import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Info, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { clubReviewSchema, type ClubDetail } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useMe } from '@/hooks/useMe';
import { CLUB_CATEGORY_LABEL } from '@/lib/labels';
import { qk } from '@/lib/queryKeys';
import { storage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { cn, isSafeUrl, titleCase } from '@/lib/utils';
import { useClub, useReviewClub } from './api';
import { RatingMeter } from './RatingMeter';

function Scale({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            onClick={() => onChange(i)}
            className={cn(
              'tabular h-9 flex-1 rounded-lg border text-sm font-medium transition',
              value === i ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function ReviewForm({ club }: { club: ClubDetail }) {
  const mine = club.myReview;
  const [usefulness, setUsefulness] = useState(mine?.usefulness ?? 0);
  const [timeCost, setTimeCost] = useState(mine?.timeCost ?? 0);
  const [review, setReview] = useState(mine?.review ?? '');
  const [error, setError] = useState('');
  const save = useReviewClub(club.slug);

  const submit = () => {
    if (!usefulness || !timeCost) return setError('Choose both ratings');
    const parsed = clubReviewSchema.safeParse({ usefulness, timeCost, review });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form');
    setError('');
    save.mutate(parsed.data, {
      onSuccess: (r) => toast.success(r.pointsEarned ? `+${r.pointsEarned} helpfulness. Thanks for the honest review!` : 'Review updated'),
      onError: (e) => setError(e.message),
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{mine ? 'Edit your review' : 'Review this club'}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Scale label="How useful?" low="Not useful" high="Very useful" value={usefulness} onChange={setUsefulness} />
        <Scale label="How much time?" low="Light" high="Very demanding" value={timeCost} onChange={setTimeCost} />
      </div>
      <Textarea
        rows={4}
        maxLength={1000}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="What did you get out of it? What should a first year know before joining?"
        aria-label="Your review"
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button onClick={submit} disabled={save.isPending}>
        {save.isPending && <Loader2 className="animate-spin" />} {mine ? 'Update review' : 'Post review'}
      </Button>
    </section>
  );
}

export function ClubPage() {
  const { slug = '' } = useParams();
  const { data: club, isLoading, error } = useClub(slug);
  const { data: me } = useMe();
  const qc = useQueryClient();

  // Track visits on this device for the "Explore 3 clubs" quest
  useEffect(() => {
    if (!slug) return;
    try {
      const prev: unknown = JSON.parse(storage.get(STORAGE_KEYS.visitedClubs) ?? '[]');
      const list = Array.isArray(prev) ? (prev as string[]) : [];
      if (!list.includes(slug)) {
        storage.set(STORAGE_KEYS.visitedClubs, JSON.stringify([...list, slug]));
        qc.invalidateQueries({ queryKey: qk.rail });
      }
    } catch {
      /* storage unavailable */
    }
  }, [slug, qc]);

  if (isLoading || !me) return <ProfileSkeleton />;
  if (error || !club) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Club not found"
        action={
          <Button asChild>
            <Link to="/clubs">All clubs</Link>
          </Button>
        }
      />
    );
  }
  const firstYear = me.role === 'STUDENT' && (me.currentYear ?? 1) === 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <header className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">{club.name}</h1>
              <p className="text-sm text-muted-foreground">
                {CLUB_CATEGORY_LABEL[club.category]}
                {club.timeCommitment && ` · ${club.timeCommitment}`}
                {club.recruitmentMonth && ` · recruits in ${club.recruitmentMonth}`}
              </p>
            </div>
            {isSafeUrl(club.joinUrl) && (
              <Button asChild>
                <a href={club.joinUrl!} target="_blank" rel="noopener noreferrer">
                  Join <ExternalLink />
                </a>
              </Button>
            )}
          </div>
          <p className="text-sm">{club.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {club.skillsGained.map((s) => (
              <span key={s} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                {titleCase(s)}
              </span>
            ))}
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            {club.reviewCount} review{club.reviewCount === 1 ? '' : 's'}
          </h2>
          {club.reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          {club.reviews.map((r) => (
            <article key={r.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={r.author} size="md" />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${r.author.handle}`} className="font-semibold hover:underline">
                    {r.author.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    <RoleBadge role={r.author.role} currentYear={r.author.currentYear} /> · <RelativeTime iso={r.updatedAt} />
                  </p>
                </div>
              </div>
              <div className="grid max-w-sm gap-2 sm:grid-cols-2">
                <RatingMeter label="Usefulness" value={r.usefulness} tone="useful" />
                <RatingMeter label="Time cost" value={r.timeCost} tone="time" />
              </div>
              <p className="text-sm">{r.review}</p>
            </article>
          ))}
        </section>

        {firstYear ? (
          <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p>Reviews come from students who've been members. Ask them questions instead!</p>
              <Button asChild size="sm">
                <Link to="/ask/new">Ask about this club</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ReviewForm key={club.myReview?.id ?? 'new'} club={club} />
        )}
      </div>

      <aside className="space-y-4 self-start lg:sticky lg:top-24">
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <h2 className="font-display text-sm font-semibold">Ratings</h2>
          <RatingMeter label="Usefulness" value={club.usefulness} tone="useful" size="lg" />
          <RatingMeter label="Time cost" value={club.timeCost} tone="time" size="lg" />
        </div>
        {club.members.length > 0 && (
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <h2 className="font-display text-sm font-semibold">Seniors who were members</h2>
            <ul className="space-y-2">
              {club.members.map((m) => (
                <li key={m.id}>
                  <Link to={`/u/${m.handle}`} className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-muted">
                    <UserAvatar user={m} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium">{m.fullName}</span>
                    <RoleBadge role={m.role} currentYear={m.currentYear} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
